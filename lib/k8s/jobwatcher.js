'use strict';

// Updates final job status if the pod starts

const constants = require('../constants');

const debug = require('debug')('tilloo:k8s/jobwatcher');
const rabbit = require('../rabbitfactory');

const config = require('../config');
const k8sJob = require('./job');

const Watcher = require('./watcher');

debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}`);

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

const watcher = new Watcher(`/apis/batch/v1/namespaces/${constants.NAMESPACE}/jobs`, async (type, apiObj, watchObj) => {
    if ((type === 'MODIFIED' || type === 'DELETED') && apiObj.status) {
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
            else if (apiObj.status.failed || type === 'DELETED') {
                await updateStatus({ status: constants.JOBSTATUS.FAIL, runId: apiObj.metadata.labels.runId, jobId: apiObj.metadata.labels.jobId });
                // Delete job in 5 minutes
                setTimeout(async () => {
                    await k8sJob.remove(apiObj.metadata.labels.runId);
                }, 1000 * 15);
            }
        }
        catch (e) {
            console.error(`Error handling job watch`, e);
        }
    }
});

watcher.start();
