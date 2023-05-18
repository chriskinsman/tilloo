'use strict';

// Looks for jobs that have been running for quite some time but haven't updated their status
// If the job can be found it is used to update the status

const constants = require('../constants');

const async = require('async');
const debug = require('debug')('tilloo:k8s/zombieruns');
const rabbit = require('../rabbitfactory');

const config = require('../config');
const Job = require('../../models/job');
const k8sClient = require('./clientFactory');
const Run = require('../../models/run');

debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}, queues: ${constants.QUEUES.STATUS}`);

async function updateStatus(message) {
    message.source = 'zombieruns';
    debug(`Updating status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
    try {
        await rabbit.publish(constants.QUEUES.STATUS, message);
    }
    catch (err) {
        console.error(`Unable to queue status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
    }
}

// Garbage collector to clean up orphaned jobs
// Looks at any run in a idle or busy state with an
// updatedAt that is more than 5 minutes old and
// marks it as failed
module.exports.start = function start() {
    debug(`zombie run garbage collection interval: ${config.scheduler.zombieFrequency} minutes`);
    setInterval(async function () {
        try {
            debug('garbage collecting zombie runs');
            const zombieRuns = await Run.find({ $or: [{ status: constants.JOBSTATUS.BUSY }, { status: constants.JOBSTATUS.IDLE }, { status: constants.JOBSTATUS.SCHEDULED }] });

            await async.eachLimit(zombieRuns, 5, async function (zombieRun) {
                const jobs = await k8sClient.api.batch.listNamespacedJob(constants.NAMESPACE, undefined, undefined, undefined, undefined, `runId=${zombieRun._id}`, 1);
                if (jobs.body.items.length > 0) {
                    const job = jobs.body.items[0];
                    debug('job', job);
                    if (job.status.failed) {
                        await updateStatus({ status: constants.JOBSTATUS.FAIL, runId: job.metadata.labels.runId, jobId: job.metadata.labels.jobId });
                        zombieRun.status = constants.JOBSTATUS.FAIL;
                    }
                    else if (job.status.succeeded) {
                        await updateStatus({ status: constants.JOBSTATUS.SUCCESS, runId: job.metadata.labels.runId, jobId: job.metadata.labels.jobId });
                        zombieRun.status = constants.JOBSTATUS.SUCCESS;
                    }
                    else if (!job.status.active && dayjs().subtract(5, 'minutes').isAfter(zombieRun.createdAt)) {
                        debug(`Job not found updating status to fail runId: ${job.metadata.labels.runId}`);
                        await updateStatus({ status: constants.JOBSTATUS.FAIL, runId: job.metadata.labels.runId, jobId: job.metadata.labels.jobId });
                        zombieRun.status = constants.JOBSTATUS.FAIL;
                    }
                }
                else {
                    debug(`No k8s job found updating status to fail runId: ${zombieRun._id}`);
                    await updateStatus({ status: constants.JOBSTATUS.FAIL, runId: zombieRun._id, jobId: zombieRun.jobId });
                    zombieRun.status = constants.JOBSTATUS.FAIL;
                }

                await async.parallel([
                    async function () {
                        try {
                            return await zombieRun.save();
                        }
                        catch (err) {
                            console.error('Error saving zombieRun', err);
                        }
                    },
                    async function () {
                        try {
                            const job = await Job.findByJobId(zombieRun.jobId);
                            if (!job) {
                                console.error('Unable to find jobId: ' + zombieRun.jobId);
                            }
                            else {
                                job.lastStatus = zombieRun.status;
                                await job.save();
                            }
                        }
                        catch (err) {
                            console.error('Unable to find jobId: ' + zombieRun.jobId, err);
                        }

                    }
                ]);
            });
        }
        catch (err) {
            console.error('ZombieRuns error', err);
        }
    }, config.scheduler.zombieFrequency * 60000);
};