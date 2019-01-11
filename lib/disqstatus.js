'use strict';

const ObjectId = require('mongoose').Types.ObjectId;
const DisqEventEmitter = require('disque-eventemitter');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Run = require('../models/run');
const Job = require('../models/job');
const iostatus = require('./iostatus');
const notifications = require('./notifications.js');
const debug = require('debug')('tilloo:status');

console.info('Listening to %s:%d queue: %s', config.disque.host, config.disque.port, constants.QUEUES.STATUS);
const ee = new DisqEventEmitter(config.disque, constants.QUEUES.STATUS, { concurrency: 10 });
ee.on('job', function(job, done) {

    function ackJob() {
        ee.ack(job, function (err) {
            if (err) {
                console.error(err);
            }

            done();
        });
    }

    const message = JSON.parse(job.body);
    debug('status message', message);
    if (message && message.runId && message.status) {
        // Don't love the write after read pattern but can't find another way to do this with MongoDb
        // Using the updatedAt to make sure it hasn't changed
        Run.findById(new ObjectId(message.runId), function (err, run) {
            let update;
            const date = new Date();

            switch (message.status) {
                case constants.JOBSTATUS.SUCCESS:
                    // Only allow transition to SUCCESS if in BUSY currently
                    if (run.status === constants.JOBSTATUS.BUSY || run.status === constants.JOBSTATUS.SCHEDULED || run.status === constants.JOBSTATUS.IDLE) {
                        update = { completedAt: date, status: constants.JOBSTATUS.SUCCESS };
                        if (message.result !== undefined) {
                            update.result = message.result;
                        }

                        notifications.notify(message);
                    }
                    else {
                        debug('not updating status for runId: %s, current status: %s, requested status: %s', message.runId, run.status, message.status);
                    }
                    break;

                case constants.JOBSTATUS.FAIL:
                    if (run.status === constants.JOBSTATUS.BUSY || run.status === constants.JOBSTATUS.SCHEDULED || run.status === constants.JOBSTATUS.IDLE || message.type === constants.KILLTYPE.MANUAL) {
                        update = { completedAt: date, status: constants.JOBSTATUS.FAIL };
                        if (message.result !== undefined && message.result !== null) {
                            update.result = message.result;
                        }
                        if (message.pod) {
                            update.pod = message.pod;
                        }

                        notifications.notify(message);
                    }
                    else {
                        debug('not updating status for runId: %s, current status: %s, requested status: %s', message.runId, run.status, message.status);
                    }
                    break;

                case constants.JOBSTATUS.SCHEDULED:
                    if (run.status === constants.JOBSTATUS.IDLE) {
                        update = { status: constants.JOBSTATUS.SCHEDULED };

                        notifications.notify(message);
                    }
                    else {
                        debug('not updating status for runId: %s, current status: %s, requested status: %s', message.runId, run.status, message.status);
                    }
                    break;

                case constants.JOBSTATUS.BUSY:
                    if (run.status === constants.JOBSTATUS.IDLE || run.status === constants.JOBSTATUS.SCHEDULED) {
                        update = { status: constants.JOBSTATUS.BUSY };
                        if (message.pod) {
                            update.pod = message.pod;
                        }
                    }
                    else {
                        debug('not updating status for runId: %s, current status: %s, requested status: %s', message.runId, run.status, message.status);
                    }

                    break;
            }

            // Save the worker off
            if (message.workername) {
                update.worker = message.workername;
            }

            if (update) {
                // Make sure if not shown as started that we update as started as we transition to any of the above
                // states
                if (!run.startedAt) {
                    update.startedAt = new Date();
                }

                // Make sure we always update updatedAt since middleware won't run
                update.updatedAt = new Date();
                debug('Updating status on runId: %s, status: %s', message.runId, message.status, update);
                // Updated at included to be pessimistic in the update and only update if it hasn't changed
                Run.findOneAndUpdate({ _id: new ObjectId(message.runId), updatedAt: run.updatedAt }, update, null, function (err, updatedRun) {
                    if (err) {
                        console.error(err);
                        done();
                    }
                    else {
                        iostatus.sendStatus(updatedRun.jobId, message.runId, message);

                        debug('Updating status on jobId: %s, runId: %s, status: %s', updatedRun.jobId, message.runId, message.status);
                        Job.findByIdAndUpdate(updatedRun.jobId, { lastStatus: message.status }, null, function (err, updatedJob) {
                            if (err) {
                                console.error(err);
                                done();
                            }
                            else {
                                ackJob();
                            }
                        });
                    }
                });
            }
            else {
                ackJob();
            }
        });
    }
    else {
        debug('Invalid status job: ', job);
        ackJob();
    }
});
