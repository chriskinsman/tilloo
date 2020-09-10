'use strict';

// Updates final job status if the pod starts

const constants = require('../constants');

const debug = require('debug')('tilloo:k8s/jobstream');
const rabbit = require('../rabbitFactory');

const Checkpoint = require('../../models/checkpoint');
const config = require('../config');
const k8sJob = require('./job');
const k8sClient = require('./clientFactory');

console.info(`Jobstream connecting to ${config.rabbitmq.host}:${config.rabbitmq.port}`);

const checkpointName = 'jobs';

async function main(checkpoint) {
    let jobStream;
    await k8sClient.loadSpec();

    function updateStatus(message) {
        message.source = 'jobstream';
        debug(`Updating status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
        rabbit.publish(constants.QUEUES.STATUS, message).catch((err) => {
            console.error(`Unable to queue status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
        });
    }

    async function initializeStream() {
        debug(`Initializing with resourceVersion: ${checkpoint.resourceVersion}`);
        jobStream = await k8sClient.apis.batch.v1.watch.namespaces(constants.NAMESPACE).jobs.getObjectStream({ qs: { resourceVersion: checkpoint.resourceVersion } });
        jobStream.on('data', (jobData) => {
            debug('jobData', jobData);

            // We can get this if the resourceVersion is too old.  This will restart things
            if (jobData.object.kind === 'Status' && jobData.object.status === 'Failure' && jobData.object.reason === 'Expired') {
                debug('resourceVersion too old reinitializing');
                checkpoint.resourceVersion = null;

                return setImmediate(initializeStream);
            }

            if (jobData.object.metadata && jobData.object.metadata.resourceVersion) {
                const resourceVersion = parseInt(jobData.object.metadata.resourceVersion, 10);
                if (resourceVersion > checkpoint.resourceVersion) {
                    checkpoint.resourceVersion = resourceVersion;
                    checkpoint.save(function (err) {
                        if (err) {
                            console.error('Jobstream error updating checkpoint resource version', err);
                        }
                        else {
                            debug(`Updated lastResourceVersion`, checkpoint.resourceVersion);
                        }
                    });

                    if ((jobData.type === 'MODIFIED' || jobData.type === 'DELETED') && jobData.object.status) {
                        try {
                            if (jobData.object.status.completionTime) {
                                debug(`job completionTime: ${jobData.object.status.completionTime}, jobId: ${jobData.object.metadata.labels.jobId}, runId: ${jobData.object.metadata.labels.runId}`);
                                const completeCondition = jobData.object.status.conditions.find(function (condition) {
                                    return condition.type === 'Complete';
                                });

                                const failedCondition = jobData.object.status.conditions.find(function (condition) {
                                    return condition.type === 'Failed';
                                });

                                if (failedCondition) {
                                    debug(`job failedCondition present jobId: ${jobData.object.metadata.labels.jobId}, runId: ${jobData.object.metadata.labels.runId}`);
                                    updateStatus({ status: constants.JOBSTATUS.FAIL, runId: jobData.object.metadata.labels.runId, jobId: jobData.object.metadata.labels.jobId });
                                }
                                else if (completeCondition) {
                                    debug(`job completeCondition present jobId: ${jobData.object.metadata.labels.jobId}, runId: ${jobData.object.metadata.labels.runId}`);
                                    updateStatus({ status: constants.JOBSTATUS.SUCCESS, runId: jobData.object.metadata.labels.runId, jobId: jobData.object.metadata.labels.jobId });
                                }

                                // Delete job in 5 minutes
                                setTimeout(async () => {
                                    await k8sJob.remove(jobData.object.metadata.labels.runId);
                                }, 1000 * 15);

                            }
                            // We got here either because the job has failed or it has been deleted.  If it was deleted but completed
                            // the previous else if clause should have hit
                            else if (jobData.object.status.failed || jobData.type === 'DELETED') {
                                updateStatus({ status: constants.JOBSTATUS.FAIL, runId: jobData.object.metadata.labels.runId, jobId: jobData.object.metadata.labels.jobId });
                                // Delete job in 5 minutes
                                setTimeout(async () => {
                                    await k8sJob.remove(jobData.object.metadata.labels.runId);
                                }, 1000 * 15);
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                else {
                    debug(`skipping old event lastResourceVersion: ${checkpoint.resourceVersion}, resourceVersion: ${jobData.object.metadata.resourceVersion}`, jobData.object.metadata);
                }
            }
        });

        // Confirmed that this fires
        jobStream.on('close', () => {
            console.error('jobStream close');
        });

        // Unconfirmed that any of the following fire. Placed to monitor
        // and see if they fire in some instances
        jobStream.on('error', (err) => {
            console.error('jobStream error:', err);
        });

        jobStream.on('timeout', (e) => {
            console.error('jobStream timeout', e);
        });

        jobStream.on('aborted', (e) => {
            console.error('jobStream aborted', e);
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
        debug(`checkpoint resourceVersion: ${checkpoint.resourceVersion}`);
        main(checkpoint);
    }
});
