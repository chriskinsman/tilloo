'use strict';

const ObjectId = require('mongoose').Types.ObjectId;

const rabbit = require('./rabbitFactory');

const config = require('./config');
const constants = require('./constants');
const Run = require('../models/run');
const Job = require('../models/job');
const iostatus = require('./iostatus');
const notifications = require('./notifications.js');
const debug = require('debug')('tilloo:status');
const util = require('util');

const runFindById = util.promisify(Run.findById).bind(Run);
const runFindOneAndUpdate = util.promisify(Run.findOneAndUpdate).bind(Run);
const jobFindByIdAndUpdate = util.promisify(Job.findByIdAndUpdate).bind(Job);

console.info(`Listening to ${config.rabbitmq.host}:${config.rabbitmq.port} queue: ${constants.QUEUES.LOGGER}`);
rabbit.subscribe(constants.QUEUES.STATUS, async (message) => {
    debug('status message', message);
    if (message && message.runId && message.status) {
        // Don't love the write after read pattern but can't find another way to do this with MongoDb
        // Using the updatedAt to make sure it hasn't changed
        try {
            const run = await runFindById(new ObjectId(message.runId));
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

                await runFindOneAndUpdate({ _id: new ObjectId(message.runId), updatedAt: run.updatedAt }, update, null);
                iostatus.sendStatus(run.jobId, message.runId, message);

                debug('Updating status on jobId: %s, runId: %s, status: %s', run.jobId, message.runId, message.status);
                await jobFindByIdAndUpdate(run.jobId, { lastStatus: message.status }, null);
            }

            return true;
        }
        catch (err) {
            console.error(err);

            return false;
        }
    }
    else {
        debug('Invalid status message: ', message);

        return false;
    }
});

