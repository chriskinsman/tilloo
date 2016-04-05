'use strict';

var util = require('util');

var ObjectId = require('mongoose').Types.ObjectId;
var DisqEventEmitter = require('disque-eventemitter');

var config = require('../lib/config');
var constants = require('../lib/constants');
var Run = require('../models/run');
var Job = require('../models/job');
var iostatus = require('./iostatus');
var notifications = require('./notifications.js');
var debug = require('debug')('tilloo:status');

console.info('Listening to %s:%d queue: %s', config.disque.host, config.disque.port, constants.QUEUES.STATUS);
var ee = new DisqEventEmitter(config.disque, constants.QUEUES.STATUS, {concurrency: 10});
ee.on('job', function(job, done) {

    function ackJob() {
        ee.ack(job, function (err) {
            if (err) {
                console.error(err);
            }

            done();
        });
    }

    var message = JSON.parse(job.body);
    debug('status message', message);
    if(message && message.runId && message.status) {
        var update;
        var date = new Date();
        switch(message.status) {
            case constants.JOBSTATUS.SUCCESS:
                update = { completedAt: date, status: constants.JOBSTATUS.SUCCESS};
                if(message.result!==undefined){
                    update.result = message.result;
                }

                notifications.notify(message);
                break;

            case constants.JOBSTATUS.FAIL:
                update = { completedAt: date, status: constants.JOBSTATUS.FAIL};
                if(message.result!==undefined && message.result!==null){
                    update.result = message.result;
                }

                notifications.notify(message);
                break;

            // Not a real job status
            case 'heartbeat':
                update = { updatedAt: date };
                break;

            case constants.JOBSTATUS.BUSY:
                update = { startedAt: date, status: constants.JOBSTATUS.BUSY};
                if(message.pid) {
                    update.pid = message.pid;
                }
                break;
        }

        // Save the worker off
        if(message.workername) {
            update.worker = message.workername;
        }

        if(update) {
            debug('Updating status on runId: %s, status: %s', message.runId, message.status);
            Run.findByIdAndUpdate(new ObjectId(message.runId), update, null, function(err, run) {
                if(err) {
                    console.error(err);
                    done();
                }
                else if (message.status !== 'heartbeat') {
                    iostatus.sendStatus(run.jobId, message.runId, message);

                    debug("Updating status on jobId: %s, status: %s", run.jobId, message.status);
                    // If not a heartbeat update job with last status
                    Job.findByIdAndUpdate(run.jobId, {lastStatus: message.status}, null, function (err, updatedJob) {
                        if (err) {
                            console.error(err);
                            done();
                        }
                        else {
                            ackJob();
                        }
                    });
                }
                else {
                    ackJob();
                }
            });
        }
        else {
            ackJob();
        }
    }
    else {
        debug('Invalid status job: ', job);
        // TODO: Instead of acking dead-letter it
        ackJob();
    }
});
