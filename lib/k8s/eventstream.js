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

function main(initialResourceVersion) {
    let lastResourceVersion = initialResourceVersion;

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
        const watchArgs = { allowWatchBookmarks: true };
        if (lastResourceVersion) {
            watchArgs.resourceVersion = lastResourceVersion;
        }

        debug(`Initializing eventStream resourceVersion: ${lastResourceVersion}`);
        await k8sClient.watch.watch(`/api/v1/namespaces/${constants.NAMESPACE}/events`, watchArgs,
            async (type, apiObj, watchObj) => {
                debug(`watchObj`, watchObj);

                // We can get this if the resourceVersion is too old.  This will restart things
                if (apiObj.kind === 'Status' && apiObj.status === 'Failure' && apiObj.reason === 'Expired') {
                    debug(`resourceVersion too old reinitializing`);
                    lastResourceVersion = 0;

                    return setImmediate(initializeStream);
                }

                if (apiObj.metadata && apiObj.metadata.resourceVersion) {
                    const currentResourceVersion = parseInt(apiObj.metadata.resourceVersion, 10);
                    if (currentResourceVersion > lastResourceVersion) {
                        lastResourceVersion = currentResourceVersion;
                        try {
                            await Checkpoint.findAndUpdateByStream(checkpointName, currentResourceVersion);
                            debug(`Updated lastResourceVersion`, currentResourceVersion);
                        }
                        catch (err) {
                            console.error('Eventstream error updating checkpoint resource version', err);
                        }

                        // Only interested in pod events
                        if (apiObj.involvedObject && apiObj.involvedObject.kind === 'Pod') {
                            const podName = apiObj.involvedObject.name;
                            const podNameParts = podName.split('-');
                            const jobId = podNameParts[0];
                            const runId = podNameParts[1];

                            // First update log with any messages
                            await addToLog(runId, apiObj.lastTimestamp, apiObj.message);

                            switch (apiObj.reason) {
                                // Job scheduled
                                case 'Scheduled':
                                    debug(`pod scheduled jobId: ${jobId}, runId: ${runId}`);
                                    await updateStatus({ status: constants.JOBSTATUS.SCHEDULED, pod: podName, runId: runId, jobId: jobId });
                                    break;

                                // Job started
                                case 'Started':
                                    debug(`pod started jobId: ${jobId}, runId: ${runId}`);
                                    await updateStatus({ status: constants.JOBSTATUS.BUSY, pod: podName, runId: runId, jobId: jobId });
                                    break;

                                // Pod failed
                                case 'Failed':
                                    debug(`pod failed jobId: ${jobId}, runId: ${runId}`);
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
                        debug(`skipping old event lastResourceVersion: ${lastResourceVersion}, resourceVersion: ${apiObj.metadata.resourceVersion}`, apiObj.metadata);
                    }
                }
            },
            (err) => {
                if (err) {
                    console.error('Error watching eventStream', err);
                }

                console.log('Restarting');
                initializeStream();
            }
        );
    }

    initializeStream();
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

        main(checkpoint.resourceVersion);
    }
    catch (err) {
        console.error('Error getting job checkpoint', err);
    }
})();
