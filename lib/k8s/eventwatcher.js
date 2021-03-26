'use strict';

// Listens to k8s events and adds them to job log.
// Updates jobStatus based on the pod having Started or failing to Start.
const constants = require('../constants');

const debug = require('debug')('tilloo:k8s/eventwatcher');
const rabbit = require('../rabbitfactory');

const config = require('../config');
const k8sJob = require('./job');

const Watcher = require('./watcher');

debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}`);

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
    // k8s flag used to indicate this message is from k8s not the job
    const message = { runId: runId, createdAt: lineTime, output: logMessage, k8s: true };
    try {
        await rabbit.publish(constants.QUEUES.LOGGER, message);
    }
    catch (err) {
        console.error(`Unable to queue output for runId: ${message.runId}, output: ${message.output}`);
    }
}

module.exports = new Watcher(`/api/v1/namespaces/${constants.NAMESPACE}/events`, async (type, apiObj, watchObj) => {
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
});

