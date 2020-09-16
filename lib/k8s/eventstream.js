'use strict';

// Listens to k8s events and adds them to job log.
// Updates jobStatus based on the pod having Started or failing to Start.
const constants = require('../constants');

const debug = require('debug')('tilloo:k8s/eventstream');
const rabbit = require('../rabbitfactory');

const Checkpoint = require('../../models/checkpoint');
const config = require('../config');
const k8sJob = require('./job');
const k8sClient = require('./clientFactory');

debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}`);

const checkpointName = 'events';

async function main(checkpoint) {
    let eventStream;
    await k8sClient.loadSpec();

    async function updateStatus(message) {
        message.source = 'eventstream';
        debug(`Updating status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
        try {
            await rabbit.publish(constants.QUEUES.STATUS, message);
        }
        catch (err) {
            console.error(`Unable to queue status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
        }
    }

    async function addToLog(runId, logTime, logMessage) {
        const lineTime = new Date(logTime);
        const message = { runId: runId, createdAt: lineTime, output: logMessage };
        try {
            await rabbit.publish(constants.QUEUES.LOGGER, message);
        }
        catch (err) {
            console.error(`Unable to queue output for runId: ${message.runId}, output: ${message.output}`);
        }
    }

    async function initializeStream() {
        const _id = Math.random().toString(26).slice(2);

        debug(`${_id} Initializing eventStream resourceVersion: ${checkpoint.resourceVersion}`);
        eventStream = await k8sClient.api.v1.watch.namespaces(constants.NAMESPACE).events.getObjectStream({ qs: { resourceVersion: checkpoint.resourceVersion } });
        eventStream.on('data', async (eventData) => {
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
                    try {
                        await checkpoint.save();
                        debug(`${_id} Updated lastResourceVersion`, checkpoint.resourceVersion);
                    }
                    catch (err) {
                        console.error('Eventstream error updating checkpoint resource version', err);
                    }

                    // Only interested in pod events
                    if (eventData.object.involvedObject && eventData.object.involvedObject.kind === 'Pod') {
                        const podName = eventData.object.involvedObject.name;
                        const podNameParts = podName.split('-');
                        const jobId = podNameParts[0];
                        const runId = podNameParts[1];

                        // First update log with any messages
                        await addToLog(runId, eventData.object.lastTimestamp, eventData.object.message);

                        switch (eventData.object.reason) {
                            // Job scheduled
                            case 'Scheduled':
                                debug(`${_id} pod scheduled jobId: ${jobId}, runId: ${runId}`);
                                await updateStatus({ status: constants.JOBSTATUS.SCHEDULED, pod: podName, runId: runId, jobId: jobId });
                                break;

                            // Job started
                            case 'Started':
                                debug(`${_id} pod started jobId: ${jobId}, runId: ${runId}`);
                                await updateStatus({ status: constants.JOBSTATUS.BUSY, pod: podName, runId: runId, jobId: jobId });
                                break;

                            // Pod failed
                            case 'Failed':
                                debug(`${_id} pod failed jobId: ${jobId}, runId: ${runId}`);
                                await updateStatus({ status: constants.JOBSTATUS.FAIL, pod: podName, runId: runId, jobId: jobId });
                                // Delete job in 5 minutes
                                setTimeout(async () => {
                                    await k8sJob.remove(runId);
                                }, 1000 * 15);

                                break;
                        }
                    }
                }
                else {
                    debug(`${_id} skipping old event lastResourceVersion: ${checkpoint.resourceVersion}, resourceVersion: ${eventData.object.metadata.resourceVersion}`, eventData.object.metadata);
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

(async () => {
    debug('starting eventstream');
    try {
        debug('Getting checkpoint');
        let checkpoint = await Checkpoint.findByStream(checkpointName);
        if (!checkpoint) {
            debug('No checkpoint found creating');
            checkpoint = await Checkpoint.initialize(checkpointName);
        }
        else {
            debug(`checkpoint resourceVersion:${checkpoint.resourceVersion}`);
        }

        setImmediate(main, checkpoint);
    }
    catch (err) {
        console.error('Error getting job checkpoint', err);
    }
})();
