'use strict';

// Updates final job status if the pod starts

const constants = require('../constants');

const debug = require('debug')('tilloo:k8s/jobstream');
const rabbit = require('../rabbitfactory');

const Checkpoint = require('../../models/checkpoint');
const config = require('../config');
const k8sJob = require('./job');
const k8sClient = require('./clientFactory');

debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}`);

const checkpointName = 'jobs';

function main(initialResourceVerison) {
    let lastResourceVersion = initialResourceVerison;

    async function updateStatus(message) {
        message.source = 'jobstream';
        debug(`Updating status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
        try {
            await rabbit.publish(constants.QUEUES.STATUS, message);
        }
        catch (err) {
            console.error(`Unable to queue status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
        }
    }

    async function initializeStream() {
        debug(`Initializing with resourceVersion: ${lastResourceVersion}`);
        const watchArgs = { allowWatchBookmarks: true };
        if (lastResourceVersion) {
            watchArgs.resourceVersion = lastResourceVersion;
        }

        await k8sClient.watch.watch(`/apis/batch/v1/namespaces/${constants.NAMESPACE}/jobs`, watchArgs,
            async (type, apiObj, watchObj) => {
                debug('jobData', apiObj);

                // We can get this if the resourceVersion is too old.  This will restart things
                if (apiObj.kind === 'Status' && apiObj.status === 'Failure' && apiObj.reason === 'Expired') {
                    debug('resourceVersion too old reinitializing');
                    lastResourceVersion = null;

                    return setImmediate(initializeStream);
                }

                if (apiObj.metadata && apiObj.metadata.resourceVersion) {
                    const currentResourceVersion = parseInt(apiObj.metadata.resourceVersion, 10);
                    if (currentResourceVersion > lastResourceVersion) {
                        lastResourceVersion = currentResourceVersion;
                        try {
                            await Checkpoint.findAndUpdateByStream(checkpointName, currentResourceVersion);
                            debug(`Updated lastResourceVersion`, lastResourceVersion);
                        }
                        catch (err) {
                            console.error('Jobstream error updating checkpoint resource version', err);
                        }

                        if ((apiObj.type === 'MODIFIED' || apiObj.type === 'DELETED') && apiObj.status) {
                            try {
                                if (apiObj.status.completionTime) {
                                    debug(`job completionTime: ${apiObj.status.completionTime}, jobId: ${apiObj.metadata.labels.jobId}, runId: ${apiObj.metadata.labels.runId}`);
                                    const completeCondition = apiObj.status.conditions.find(function (condition) {
                                        return condition.type === 'Complete';
                                    });

                                    const failedCondition = apiObj.status.conditions.find(function (condition) {
                                        return condition.type === 'Failed';
                                    });

                                    if (failedCondition) {
                                        debug(`job failedCondition present jobId: ${apiObj.metadata.labels.jobId}, runId: ${apiObj.metadata.labels.runId}`);
                                        await updateStatus({ status: constants.JOBSTATUS.FAIL, runId: apiObj.metadata.labels.runId, jobId: apiObj.metadata.labels.jobId });
                                    }
                                    else if (completeCondition) {
                                        debug(`job completeCondition present jobId: ${apiObj.metadata.labels.jobId}, runId: ${apiObj.metadata.labels.runId}`);
                                        await updateStatus({ status: constants.JOBSTATUS.SUCCESS, runId: apiObj.metadata.labels.runId, jobId: apiObj.metadata.labels.jobId });
                                    }

                                    // Delete job in 5 minutes
                                    setTimeout(async () => {
                                        await k8sJob.remove(apiObj.metadata.labels.runId);
                                    }, 1000 * 15);

                                }
                                // We got here either because the job has failed or it has been deleted.  If it was deleted but completed
                                // the previous else if clause should have hit
                                else if (apiObj.status.failed || apiObj.type === 'DELETED') {
                                    await updateStatus({ status: constants.JOBSTATUS.FAIL, runId: apiObj.metadata.labels.runId, jobId: apiObj.metadata.labels.jobId });
                                    // Delete job in 5 minutes
                                    setTimeout(async () => {
                                        await k8sJob.remove(apiObj.metadata.labels.runId);
                                    }, 1000 * 15);
                                }
                            }
                            catch (e) {
                                console.error(e);
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
    debug('Starting jobstream');
    try {
        debug('Getting checkpoint');
        const checkpoint = await Checkpoint.findByStream(checkpointName);
        if (!checkpoint) {
            debug('No checkpoint found creating');
            await Checkpoint.initialize(checkpointName);
        }
        else {
            debug(`checkpoint resourceVersion: ${checkpoint.resourceVersion}`);
        }

        // Used to move to next tick to prevent issues with checkpoint.save() in same tick
        main(checkpoint.resourceVersion);
    }
    catch (err) {
        console.error('Error getting job checkpoint', err);
    }
})();
