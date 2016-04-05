'use strict';

var Disqueue = require('disqueue-node');
var async = require('async');

var config = require('./config');
var constants = require('./constants');
var Run = require('../models/run');

var disq = new Disqueue(config.disque);
var debug = require('debug')('tilloo:runs');

var Runs = {};

Runs.killRun = function killRun(runId, force, callback) {
    Run.findByRunId(runId, function(err, run) {
        if(err) {
            return callback(err);
        }
        else {
            async.parallel([
                    function(done) {
                        disq.addJob({queue: constants.QUEUES.KILL_PREFIX + run.worker, job: JSON.stringify({pid: run.pid}), timeout: 0}, function(err) {
                            if (err) {
                                debug('Unable to queue kill for worker: %s, pid: %d', run.worker, run.pid);
                            }
                            else {
                                debug('kill sent to worker: %s, pid: %d', run.worker, run.pid);
                            }
                            done();
                        });
                    },
                    function(done) {
                        if(force) {
                            disq.addJob({queue: constants.QUEUES.STATUS, job: JSON.stringify({status: constants.JOBSTATUS.FAIL, runId: run._id}), timeout: 0}, function(err) {
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



module.exports = Runs;