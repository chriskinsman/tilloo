'use strict';

const Disqueue = require('disqueue-node');
const async = require('async');

const config = require('./config');
const constants = require('./constants');
const Run = require('../models/run');
const Log = require('../models/log');
const K8sJob = require('./k8s/job');

const disq = new Disqueue(config.disque);
const debug = require('debug')('tilloo:runs');

const Runs = {};

Runs.killRun = function killRun(runId, force, callback) {
    Run.findByRunId(runId, function(err, run) {
        if(err) {
            callback(err);
        }
        else {
            async.parallel([
                function (done) {
                    K8sJob.stop(runId)
                        .then(function (res) {
                            debug('job killed runId: %s', runId, res);
                            done();
                        })
                        .catch(function (err) {
                            console.error(`Unable to kill job runId: ${runId}`, err);
                            done();
                        });
                },
                function(done) {
                    if(force) {
                        disq.addJob({ queue: constants.QUEUES.STATUS, job: JSON.stringify({ status: constants.JOBSTATUS.FAIL, runId: run._id, type:constants.KILLTYPE.MANUAL }), timeout: 0 }, function(err) {
                                if(err) {
                                    debug('Unable to queue fail status for jobId: %s, runId: %s, status: %s', run.jobId, run._id, run.status);
                                }
                                else {
                                    debug('fail status sent');
                                }
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
        async.eachLimit(runs, 10, function(run, done) {
            Log.deleteOutputForRun(run._id, function(err) {
                if(err) {
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