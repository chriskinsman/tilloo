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

Runs.killRun = function killRun(runId, force, callback) {
    Run.findByRunId(runId, function (err, run) {
        if (err) {
            callback(err);
        }
        else {
            async.parallel([
                function (done) {
                    K8sJob.remove(runId)
                        .then(function (res) {
                            debug('job killed runId: %s', runId, res);
                            done();
                        })
                        .catch(function (err) {
                            console.error(`Unable to kill job runId: ${runId}`, err);
                            done();
                        });
                },
                function (done) {
                    if (force) {
                        rabbit.publish(constants.QUEUES.STATUS, { status: constants.JOBSTATUS.FAIL, runId: run._id, type: constants.KILLTYPE.MANUAL, source: 'runs' }).then(() => {
                            debug('fail status sent');
                        }).catch((err) => {
                            debug(`Unable to queue fail status for jobId: ${run.jobId}, runId: ${run._id}, status: ${run.status}`);
                        }).finally(() => {
                            done();
                        });
                    }
                    else {
                        setImmediate(done);
                    }
                }
            ],
                callback);
        }
    });
};

Runs.deleteRunsOlderThan = function deleteRunsOlderThan(days, callback) {
    Run.findRunsOlderThan(days, function (err, runs) {
        console.info('Deleting ' + runs.length + ' runs');
        async.eachLimit(runs, 10, function (run, done) {
            Log.deleteOutputForRun(run._id, function (err) {
                if (err) {
                    console.error('log delete err: ' + err);
                    // Eat the error and keep deleting records
                    done();
                }
                else {
                    run.remove(function (err) {
                        if (err) {
                            console.error('run delete err: ' + err);
                        }
                        // Eat the error and keep deleting records
                        done();
                    });
                }
            });
        }, callback);
    });
};


module.exports = Runs;