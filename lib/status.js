'use strict';

var util = require('util');

var ObjectId = require('mongoose').Types.ObjectId;
var DisqEventEmitter = require('disque-eventemitter');

var config = require('../lib/config');
var constants = require('../lib/constants');
var Run = require('../models/run');
var Job = require('../models/job');
var webstatus = require('./webstatus');

var debuglog = util.debuglog('TILLOO');

var ee = new DisqEventEmitter(config.disque, constants.QUEUES.STATUS, {concurrency: 10});
ee.on('job', function(job, done) {
    var message = JSON.parse(job.body);
    debuglog('status message', message);
    if(message && message.runId && message.status) {
        var update;
        var date = new Date();
        switch(message.status) {
            case 'success':
                update = { completedAt: date, status: 'success'};
                if(message.result!==undefined){
                    update.result = message.result;
                }
                break;

            case 'fail':
                update = { completedAt: date, status: 'fail'};
                if(message.result!==undefined){
                    update.result = message.result;
                }
                break;

            case 'heartbeat':
                update = { updatedAt: date };
                break;

            case 'busy':
                update = { startedAt: date, status: 'busy'};
                if(message.pid) {
                    update.pid = message.pid;
                }
                break;
        }

        webstatus.sendStatus(message.runId, message);

        if(update) {
            debuglog('Updating status on runId: %s, status: %s', message.runId, message.status);
            Run.findByIdAndUpdate(new ObjectId(message.runId), update, null, function(err, run) {
                if(err) {
                    console.error(err);
                    done();
                }
                else if (message.status !== 'heartbeat') {
                    debuglog("Updating status on jobId: %s, status: %s", run.jobId, message.status);
                    // If not a heartbeat update job with last status
                    Job.findByIdAndUpdate(run.jobId, {lastStatus: message.status}, null, function (err, updatedJob) {
                        if (err) {
                            console.error(err);
                            done();
                        }
                        else {
                            ee.ack(job, function (err) {
                                if (err) {
                                    console.error(err);
                                }

                                done();
                            });
                        }
                    });
                }
                else {
                    done();
                }
            });
        }
        else {
            done();
        }
    }
    else {
        debuglog('Invalid status job: ', job);
        // TODO: Instead of acking dead-letter it
        ee.ack(job, function(err) {
            if(err) {
                console.error(err);
            }

            done();
        });
    }
});