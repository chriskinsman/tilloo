'use strict';

const async = require('async');

const config = require('./config');
const constants = require('./constants');
const Run = require('../models/run');
const Log = require('../models/log');
const K8sJob = require('./k8s/job');
const rabbit = require('./rabbitfactory');


const debug = require('debug')('tilloo:runs');
debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}, queue: ${constants.QUEUES.STATUS}`);

const Runs = {};

Runs.killRun = async function killRun(runId, force, callback) {
    try {
        const run = await Run.findByRunId(runId);
        await async.parallel([
            async function remove() {
                try {
                    await K8sJob.remove(runId);
                    debug('job killed runId: %s', runId);
                }
                catch (err) {
                    console.error(`Unable to kill job runId: ${runId}`, err);
                }
            },
            async function publish() {
                if (force) {
                    try {
                        await rabbit.publish(constants.QUEUES.STATUS, { status: constants.JOBSTATUS.FAIL, runId: run._id, type: constants.KILLTYPE.MANUAL, source: 'runs' });
                        debug('fail status sent');
                    }
                    catch (err) {
                        debug(`Unable to queue fail status for jobId: ${run.jobId}, runId: ${run._id}, status: ${run.status}`);
                    }
                }
            }
        ]);
    }
    catch (err) {
        console.error('Error killing run', err);
        throw new Error('Error killing run');
    }
};

Runs.deleteRunsOlderThan = async function deleteRunsOlderThan(days) {
    const runs = await Run.findRunsOlderThan(days);
    console.info('Deleting ' + runs.length + ' runs');
    await async.eachLimit(runs, 10, async function (run) {
        try {
            await Log.deleteOutputForRun(run._id);
            await run.remove();
        }
        catch (err) {
            console.error('log delete err: ' + err);
        }
    });
};


module.exports = Runs;