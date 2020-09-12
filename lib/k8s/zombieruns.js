'use strict';

// Looks for jobs that have been running for quite some time but haven't updated their status
// If the job can be found it is used to update the status

const constants = require('../constants');

const async = require('async');
const debug = require('debug')('tilloo:k8s/zombieruns');
const rabbit = require('../rabbitfactory');
const moment = require('moment');

const config = require('../config');
const Job = require('../../models/job');
const k8sClient = require('./clientFactory');
const Run = require('../../models/run');

debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}, queues: ${constants.QUEUES.STATUS}`);

function updateStatus(message) {
    message.source = 'zombieruns';
    debug(`Updating status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
    rabbit.publish(constants.QUEUES.STATUS, message).catch((err) => {
        console.error(`Unable to queue status for jobId: ${message.jobId}, runId: ${message.runId}, status: ${message.status}`, message);
    });
}

// Garbage collector to clean up orphaned jobs
// Looks at any run in a idle or busy state with an
// updatedAt that is more than 5 minutes old and
// marks it as failed
debug(`zombie run garbage collection interval: ${config.scheduler.zombieFrequency} minutes`);
setInterval(function () {
    debug('garbage collecting zombie runs');
    Run.find({ $or: [{ status: constants.JOBSTATUS.BUSY }, { status: constants.JOBSTATUS.IDLE }, { status: constants.JOBSTATUS.SCHEDULED }] },
        function (err, zombieRuns) {
            async.eachLimit(zombieRuns, 5, async function (zombieRun, done) {
                const jobs = await k8sClient.apis.batch.v1.namespaces(constants.NAMESPACE).jobs.get({ qs: { labelSelector: `runId=${zombieRun._id}` } }); // eslint-disable-line no-await-in-loop
                if (jobs.body.items.length > 0) {
                    const job = jobs.body.items[0];
                    debug('job', job);
                    if (job.status.failed) {
                        updateStatus({ status: constants.JOBSTATUS.FAIL, runId: job.metadata.labels.runId, jobId: job.metadata.labels.jobId });
                        zombieRun.status = constants.JOBSTATUS.FAIL;
                    }
                    else if (job.status.succeeded) {
                        updateStatus({ status: constants.JOBSTATUS.SUCCESS, runId: job.metadata.labels.runId, jobId: job.metadata.labels.jobId });
                        zombieRun.status = constants.JOBSTATUS.SUCCESS;
                    }
                    else if (!job.status.active && moment().subtract(5, 'minutes').isAfter(zombieRun.createdAt)) {
                        debug(`Job not found updating status to fail runId: ${job.metadata.labels.runId}`);
                        updateStatus({ status: constants.JOBSTATUS.FAIL, runId: job.metadata.labels.runId, jobId: job.metadata.labels.jobId });
                        zombieRun.status = constants.JOBSTATUS.FAIL;
                    }
                }
                else {
                    debug(`No k8s job found updating status to fail runId: ${zombieRun._id}`);
                    updateStatus({ status: constants.JOBSTATUS.FAIL, runId: zombieRun._id, jobId: zombieRun.jobId });
                    zombieRun.status = constants.JOBSTATUS.FAIL;
                }

                async.parallel([
                    function (done) {
                        zombieRun.save(done);
                    },
                    function (done) {
                        Job.findByJobId(zombieRun.jobId, function (err, job) {
                            if (err || !job) {
                                console.error('Unable to find jobId: ' + zombieRun.jobId);
                                done();
                            }
                            else {
                                job.lastStatus = zombieRun.status;
                                job.save(done);
                            }
                        });
                    }
                ], done);
            }, function (err) {
                if (err) {
                    console.error(err);
                }
            });
        }
    );
}, config.scheduler.zombieFrequency * 60000);
