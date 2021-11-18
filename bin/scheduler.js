#! /usr/bin/env node
'use strict';

const mongoose = require('../lib/mongooseinit');
const ObjectId = mongoose.Types.ObjectId;

const rabbit = require('../lib/rabbitfactory');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Job = require('../models/job');

const logwriter = require('../lib/logwriter');
const status = require('../lib/mqstatus');
const jobWatcher = require('../lib/k8s/jobwatcher');
const eventWatcher = require('../lib/k8s/eventwatcher');
const zombieRuns = require('../lib/k8s/zombieruns');
const jobCleanup = require('../lib/k8s/jobcleanup');
const runLogCleanup = require('../lib/runlogcleanup');

const iostatus = require('../lib/iostatus');

const debug = require('debug')('tilloo:scheduler');

const _loadedJobs = {};

(async () => {
    try {
        await rabbit.initialize();
        debug('starting services');
        status.start();
        logwriter.start();
        eventWatcher.start();
        jobWatcher.start();
        zombieRuns.start();
        jobCleanup.start();
        runLogCleanup.start();
        const jobs = await Job.loadAllJobs();
        debug('loading jobs');
        jobs.forEach((job) => {
            debug('found job %s', job.name);
            if (job.schedule && job.schedule.trim() !== '') {
                debug('setting up cron %s for %s', job.schedule, job.name);
                _loadedJobs[job._id] = job;
                job.startCron();
            }
        });

        console.info('Scheduler started');
        debug('Scheduler started connected to %s', config.db);

        // Used so scheduler is notified of changes and can add/remove/change jobs
        rabbit.subscribe(constants.QUEUES.SCHEDULER, async (message) => {
            async function updateJob(jobId) {
                try {
                    deleteJob(jobId, true);

                    const dbJob = await Job.findById(new ObjectId(jobId));
                    _loadedJobs[jobId] = dbJob;
                    dbJob.startCron();
                    debug('updated jobId: %s', jobId);
                    iostatus.sendJobChange(jobId);
                }
                catch (e) {
                    console.error('scheduler:updateJob err', e);
                }
            }

            function deleteJob(jobId, partOfUpdate) {
                try {
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
                catch (e) {
                    console.error('scheduler:deleteJob err', e);
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
    }
    catch (err) {
        console.error('Scheduler error', err);
        process.exit(1);
    }
})();
