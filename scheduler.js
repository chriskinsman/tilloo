'use strict';

var util = require('util');

var async = require('async');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var moment = require('moment');
var DisqEventEmitter = require('disque-eventemitter');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Job = require('./models/job');
var Run = require('./models/run');
// Don't remove.  Loading this causes logger to start
var logger = require('./lib/logger');
// Don't remove.  Loading this causes status to start
var status = require('./lib/status');

mongoose.connect(config.db);
var debuglog = util.debuglog('TILLOO');

var _loadedJobs = {};

Job.loadAllJobs(function(err, jobs) {
    debuglog('loading jobs');
    jobs.forEach(function(job) {
        debuglog('found job %s', job.name);
        if(job.schedule && job.schedule.trim()!=='') {
            debuglog('setting up cron %s for %s', job.schedule, job.name);
            _loadedJobs[job._id] = job;
            job.startCron();
        }
    });
    debuglog('jobs loaded');
});


// Garbage collector to clean up orphaned jobs
// Looks any run in a idle or busy state with an
// updatedAt that is more than 5 minutes old and
// marks it as failed
setInterval(function() {
    debuglog('garbage collecting zombie runs');
    Run.find({
        $and: [{updatedAt: {$lte: moment().subtract(5, 'minutes').toDate()}},
                {$or: [{status: 'busy'}, {status: 'idle'}]}
            ]},
        function(err, zombieRuns) {
            async.eachLimit(zombieRuns, 5, function(zombieRun, done) {
                debuglog('settting status to fail runId: %s', zombieRun._id);
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
            deleteJob(jobId, function() {
                Job.findById(new ObjectId(jobId), function(err, dbJob) {
                    if(err) {
                        console.error(err);
                        callback(err);
                    }
                    else {
                        _loadedJobs[jobId] = dbJob;
                        dbJob.startCron();
                        debuglog('updated jobId: %s', jobId);
                        console.dir(Object.keys(_loadedJobs));
                        callback();
                    }
                });
            });
        }

        function deleteJob(jobId, callback) {
            if(_loadedJobs[jobId]) {
                // Get it
                var loadedJob = _loadedJobs[jobId];
                // Remove it from list
                delete _loadedJobs[jobId];
                // Stop it
                loadedJob.stopCron();
                debuglog('removed jobId: %s', jobId);
                console.dir(Object.keys(_loadedJobs));
            }

            callback();
        }

        var message = JSON.parse(job.body);
        switch(message.action) {
            case 'new':
                // New job has been added.  Make sure to handle case where
                // message is old and job has already been loaded in scheduler
                // if this is the case we ignore the message
                updateJob(message.jobId, done);
                break;

            case 'deleted':
                // Job has been deleted
                deleteJob(message.jobId, done);
                break;

            case 'updated':
                // Job has changed
                updateJob(message.jobId, done);
                break;
        }
    });
});