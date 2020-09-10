#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

const rabbit = require('../lib/rabbitFactory');

const config = require('../lib/config');
const constants = require('../lib/constants');
const util = require('util');
const Job = require('../models/job');
// Don't remove.  Loading this causes logger to start
const logger = require('../lib/logwriter'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes status to start
const status = require('../lib/mqstatus'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes jobStream to start
const jobStream = require('../lib/k8s/jobstream'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes eventStream to start
const eventStream = require('../lib/k8s/eventstream'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes the zombieRuns to start
const zombieRuns = require('../lib/k8s/zombieruns'); // eslint-disable-line no-unused-vars
// Don't remove.  Loading this causes the cleanupJobs to start
const jobCleanup = require('../lib/k8s/jobcleanup'); // eslint-disable-line no-unused-vars

const iostatus = require('../lib/iostatus');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.db);
mongoose.Promise = global.Promise;

const debug = require('debug')('tilloo:scheduler');

const _loadedJobs = {};

Job.loadAllJobs(function (err, jobs) {
    debug('loading jobs');
    jobs.forEach(function (job) {
        debug('found job %s', job.name);
        if (job.schedule && job.schedule.trim() !== '') {
            debug('setting up cron %s for %s', job.schedule, job.name);
            _loadedJobs[job._id] = job;
            job.startCron();
        }
    });
    console.info('Scheduler started');
    debug('Scheduler started connected to %s', config.db);
});

const jobFindById = util.promisify(Job.findById).bind(Job);

// Used so scheduler is notified of changes and can add/remove/change jobs
console.info(`Listening to ${config.rabbitmq.host}:${config.rabbitmq.port} queue: ${constants.QUEUES.SCHEDULER}`);
rabbit.subscribe(constants.QUEUES.SCHEDULER, async (message) => {
    async function updateJob(jobId) {
        deleteJob(jobId, true);

        const dbJob = await jobFindById(new ObjectId(jobId));
        _loadedJobs[jobId] = dbJob;
        dbJob.startCron();
        debug('updated jobId: %s', jobId);
        iostatus.sendJobChange(jobId);
    }

    function deleteJob(jobId, partOfUpdate) {
        if (_loadedJobs[jobId]) {
            // Get it
            const loadedJob = _loadedJobs[jobId];
            // Remove it from list
            delete _loadedJobs[jobId];
            // Stop it
            loadedJob.stopCron();
            debug('removed jobId: %s', jobId);
        }

        if (!partOfUpdate) {
            iostatus.sendJobChange(jobId);
        }
    }

    switch (message.action) {
        case constants.SCHEDULERACTION.NEW:
            // New job has been added.  Make sure to handle case where
            // message is old and job has already been loaded in scheduler
            // if this is the case we ignore the message
            await updateJob(message.jobId);
            break;

        case constants.SCHEDULERACTION.DELETED:
            // Job has been deleted
            deleteJob(message.jobId, false);
            break;

        case constants.SCHEDULERACTION.UPDATED:
            // Job has changed
            await updateJob(message.jobId);
            break;
    }

    return true;
});