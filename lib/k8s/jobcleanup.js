'use strict';

// Looks for k8s jobs that were not properly cleaned up and deletes them after 24 hours

const constants = require('../constants');

const async = require('async');
const debug = require('debug')('tilloo:k8s/jobcleanup');
const _ = require('lodash');

const config = require('../config');
const k8sClient = require('./clientFactory');
const Job = require('./job');

(async () => {
    await k8sClient.loadSpec();
    debug('job cleanup interval: %d minutes', config.scheduler.jobCleanupFrequency);
    setInterval(async function () {
        debug('looking for jobs to cleanup');
        // , fieldSelector: 'status.phase!=Running,status.phase!=Pending' } }
        const jobs = await k8sClient.apis.batch.v1.namespaces(constants.NAMESPACE).jobs.get({ qs: { includeUninitialized: false } }); // eslint-disable-line no-await-in-loop
        debug(`${jobs.body.items.length} jobs found`);
        // Filter out inactive jobs
        const filteredJobs = _.filter(jobs.body.items, function (job) {
            return job.status.active !== 1;
        });
        if (filteredJobs.length > 0) {
            debug(`${filteredJobs.length} active jobs found`);
            async.eachLimit(filteredJobs, 5, async function (job) {
                if (job.metadata && job.metadata.labels && job.metadata.labels.runId) {
                    debug(`Removing job for runId: ${job.metadata.labels.runId}`);
                    await Job.remove(job.metadata.labels.runId);
                }
            }, function (err) {
                debug('Finished job cleanup');
                if (err) {
                    console.error(err);
                }
            });
        }
        else {
            debug('No jobs found');
        }
    }, config.scheduler.jobCleanupFrequency * 60000);
})();
