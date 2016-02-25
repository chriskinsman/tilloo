#! /usr/bin/env node
'use strict';

var util = require('util');

var async = require('async');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var moment = require('moment');
var DisqEventEmitter = require('disque-eventemitter');

var config = require('../lib/config');
var constants = require('../lib/constants');
var Job = require('../models/job');
var Run = require('../models/run');
// Don't remove.  Loading this causes logger to start
var logger = require('../lib/logger');
// Don't remove.  Loading this causes status to start
var status = require('../lib/status');
var webstatus = require('../lib/webstatus');

mongoose.connect(config.db);
var debug = require('debug')('tilloo:scheduler');

var _loadedJobs = {};

Job.loadAllJobs(function(err, jobs) {
    debug('loading jobs');
    jobs.forEach(function(job) {
        debug('found job %s', job.name);
        if(job.schedule && job.schedule.trim()!=='') {
            debug('setting up cron %s for %s', job.schedule, job.name);
            _loadedJobs[job._id] = job;
            job.startCron();
        }
    });
    debug('jobs loaded');
});


// Garbage collector to clean up orphaned jobs
// Looks any run in a idle or busy state with an
// updatedAt that is more than 5 minutes old and
// marks it as failed
setInterval(function() {
    debug('garbage collecting zombie runs');
    Run.find({
        $and: [{updatedAt: {$lte: moment().subtract(5, 'minutes').toDate()}},
                {$or: [{status: 'busy'}, {status: 'idle'}]}
            ]},
        function(err, zombieRuns) {
            async.eachLimit(zombieRuns, 5, function(zombieRun, done) {
                debug('settting status to fail runId: %s', zombieRun._id);
                zombieRun.status = 'fail';
                zombieRun.save(done);
            }, function(err) {
                if(err) {
                    console.error(err);
                }
            });
        }
    );
}, 60000);

// Used so scheduler is notified of changes and can add/remove/change jobs
var ee = new DisqEventEmitter(config.disque, constants.QUEUES.SCHEDULER);
ee.on('job', function(job, done) {
    // Immediately ack job to remove from queue.  If we have a failure
    // we don't want to deal with job again, best to just restart the scheduler
    ee.ack(job, function(err) {
        if(err) {
            console.error(err);
        }

        function updateJob(jobId, callback) {
            deleteJob(jobId, true, function() {
                Job.findById(new ObjectId(jobId), function(err, dbJob) {
                    if(err) {
                        console.error(err);
                        callback(err);
                    }
                    else {
                        _loadedJobs[jobId] = dbJob;
                        dbJob.startCron();
                        debug('updated jobId: %s', jobId);
                        webstatus.sendJobChange(jobId);
                        callback();
                    }
                });
            });
        }

        function deleteJob(jobId, partOfUpdate, callback) {
            if(_loadedJobs[jobId]) {
                // Get it
                var loadedJob = _loadedJobs[jobId];
                // Remove it from list
                delete _loadedJobs[jobId];
                // Stop it
                loadedJob.stopCron();
                debug('removed jobId: %s', jobId);
            }

            if(!partOfUpdate) {
                webstatus.sendJobChange(jobId);
            }
            callback();
        }

        var message = JSON.parse(job.body);
        switch(message.action) {
            case constants.SCHEDULERACTION.NEW:
                // New job has been added.  Make sure to handle case where
                // message is old and job has already been loaded in scheduler
                // if this is the case we ignore the message
                updateJob(message.jobId, done);
                break;

            case constants.SCHEDULERACTION.DELETED:
                // Job has been deleted
                deleteJob(message.jobId, false, done);
                break;

            case constants.SCHEDULERACTION.UPDATED:
                // Job has changed
                updateJob(message.jobId, done);
                break;
        }
    });
});