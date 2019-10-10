#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const DisqEventEmitter = require('disque-eventemitter');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Job = require('../models/job');
// Don't remove.  Loading this causes logger to start
const logger = require('../lib/logwriter'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes status to start
const status = require('../lib/disqstatus'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes jobStream to start
const jobStream = require('../lib/k8s/jobstream'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes eventStream to start
const eventStream = require('../lib/k8s/eventstream'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes the zombieRuns to start
const zombieRuns = require('../lib/k8s/zombieruns'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes the cleanupJobs to start
const jobCleanup = require('../lib/k8s/jobcleanup'); // eslint-disable-line no-unused-vars

const iostatus = require('../lib/iostatus');

mongoose.connect(config.db, { useMongoClient: true });
mongoose.Promise = global.Promise;
const debug = require('debug')('tilloo:scheduler');

const _loadedJobs = {};

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
    console.info('Scheduler started');
    debug('Scheduler started connected to %s', config.db);
});


// Used so scheduler is notified of changes and can add/remove/change jobs
console.info('Listening to %s:%d queue: %s', config.disque.host, config.disque.port, constants.QUEUES.SCHEDULER);
const ee = new DisqEventEmitter(config.disque, constants.QUEUES.SCHEDULER);
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
                        iostatus.sendJobChange(jobId);
                        callback();
                    }
                });
            });
        }

        function deleteJob(jobId, partOfUpdate, callback) {
            if(_loadedJobs[jobId]) {
                // Get it
                const loadedJob = _loadedJobs[jobId];
                // Remove it from list
                delete _loadedJobs[jobId];
                // Stop it
                loadedJob.stopCron();
                debug('removed jobId: %s', jobId);
            }

            if(!partOfUpdate) {
                iostatus.sendJobChange(jobId);
            }
            callback();
        }

        const message = JSON.parse(job.body);
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