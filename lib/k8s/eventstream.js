'use strict';

// Listens to k8s events and adds them to job log.
// Updates jobStatus based on the pod having Started or failing to Start.
const constants = require('../constants');

const debug = require('debug')('tilloo:k8s/eventstream');
const Disqueue = require('disqueue-node');
const JSONStream = require('json-stream');

const Checkpoint = require('../../models/checkpoint');
const config = require('../config');
const k8sJob = require('./job');
const k8sClient = require('./clientFactory');

const disq = new Disqueue(config.disque);

const checkpointName = 'events';

async function main(checkpoint) {
    let eventStream;
    let jsonEventStream;
    await k8sClient.loadSpec();

    function updateStatus(message) {
        message.source = 'eventstream';
        debug('Updating status for jobId: %s, runId: %s, status: %s', message.jobId, message.runId, message.status, message);
        disq.addJob({ queue: constants.QUEUES.STATUS, job: JSON.stringify(message), timeout: 0 }, function (err) {
            if (err) {
                console.error('Unable to queue status for jobId: %s, runId: %s, status: %s', message.jobId, message.runId, message);
            }
        });
    }

    function addToLog(runId, logTime, logMessage) {
        const lineTime = new Date(logTime);
        const message = { runId: runId, createdAt: lineTime, output: logMessage };
        disq.addJob({ queue: constants.QUEUES.LOGGER, job: JSON.stringify(message), timeout: 0 }, function (err) {
            if (err) {
                console.error('Unable to queue output for runId: %s, output: %s', message.runId, message.output);
            }
        });
    }

    function initializeStream() {
        const _id = Math.random().toString(26).slice(2);

        // abort the old stream
        if (eventStream) {
            debug(`${_id} aborting old eventStream`);
            eventStream.abort();
            eventStream.removeAllListeners();
        }

        debug(`${_id} Initializing eventStream resourceVersion: ${checkpoint.resourceVersion}`);
        eventStream = k8sClient.apis.v1.watch.namespaces(constants.NAMESPACE).events.getStream({ qs: { resourceVersion: checkpoint.resourceVersion } });
        jsonEventStream = new JSONStream();
        eventStream.pipe(jsonEventStream);
        jsonEventStream.on('data', (eventData) => {
            debug(`${_id} eventData`, eventData);

            // We can get this if the resourceVersion is too old.  This will restart things
            if (eventData.object.kind === 'Status' && eventData.object.status === 'Failure' && eventData.object.reason === 'Expired') {
                debug(`${_id} resourceVersion too old reinitializing`);
                checkpoint.resourceVersion = 0;

                return setImmediate(initializeStream);
            }

            if (eventData.object.metadata && eventData.object.metadata.resourceVersion) {
                const resourceVersion = parseInt(eventData.object.metadata.resourceVersion, 10);
                if (resourceVersion > checkpoint.resourceVersion) {
                    checkpoint.resourceVersion = resourceVersion;
                    checkpoint.save(function (err) {
                        if (err) {
                            console.error('Eventstream error updating checkpoint resource version', err);
                        }
                        else {
                            debug(`${_id} Updated lastResourceVersion`, checkpoint.resourceVersion);
                        }
                    });

                    // Only interested in pod events
                    if (eventData.object.involvedObject && eventData.object.involvedObject.kind === 'Pod') {
                        const podName = eventData.object.involvedObject.name;
                        const podNameParts = podName.split('-');
                        const jobId = podNameParts[0];
                        const runId = podNameParts[1];

                        // First update log with any messages
                        addToLog(runId, eventData.object.lastTimestamp, eventData.object.message);

                        switch (eventData.object.reason) {
                            // Job scheduled
                            case 'Scheduled':
                                debug(`${_id} pod scheduled jobId: %s, runId: %s`, jobId, runId);
                                updateStatus({ status: constants.JOBSTATUS.SCHEDULED, pod: podName, runId: runId, jobId: jobId });
                                break;

                            // Job started
                            case 'Started':
                                debug(`${_id} pod started jobId: %s, runId: %s`, jobId, runId);
                                updateStatus({ status: constants.JOBSTATUS.BUSY, pod: podName, runId: runId, jobId: jobId });
                                break;

                            // Pod failed
                            case 'Failed':
                                debug(`${_id} pod failed jobId: %s, runId: %s`, jobId, runId);
                                updateStatus({ status: constants.JOBSTATUS.FAIL, pod: podName, runId: runId, jobId: jobId });
                                // Delete job in 5 minutes
                                setTimeout(async () => {
                                    await k8sJob.remove(runId);
                                }, 1000 * 15);

                                break;
                        }
                    }
                }
                else {
                    debug(`${_id} skipping old event lastResourceVersion: %s, resourceVersion: %s`, checkpoint.resourceVersion, eventData.object.metadata.resourceVersion, eventData.object.metadata);
                }
            }
        });

        // Confirmed that this fires
        eventStream.on('close', () => {
            console.error('eventStream close');
        });

        // Unconfirmed that any of the following fire. Placed to monitor
        // and see if they fire in some instances
        eventStream.on('error', (err) => {
            console.error('eventStream error:', err);
        });

        eventStream.on('timeout', (e) => {
            console.error('eventStream timeout', e);
        });

        eventStream.on('aborted', (e) => {
            console.error('eventStream aborted', e);
        });
    }

    initializeStream();
    // Hack to deal with kubernetes-client dropping stream without warning
    setInterval(initializeStream, 1000 * 60 * 15);
}

Checkpoint.findByStream(checkpointName, function (err, checkpoint) {
    if (err) {
        console.error('Error getting job checkpoint', err);
    }
    else if (!checkpoint) {
        debug('No checkpoint found creating');
        Checkpoint.initialize(checkpointName, function (err, checkpoint) {
            if (err) {
                console.error('Error initializing checkpoint', err);
            }
            else {
                main(checkpoint);
            }
        });
    }
    else {
        debug('checkpoint resourceVersion:%s', checkpoint.resourceVersion);
        main(checkpoint);
    }
});

