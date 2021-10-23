#! /usr/bin/env node
'use strict';

const commander = require('commander');

const jobs = require('../lib/jobs');

function list(val) {
    return val.split(',');
}

commander.version('0.0.1')
    .usage('<jobid> [options]')
    .option('-s, --schedule <schedule>', 'Schedule in cron form')
    .option('-i, --imageuri <imageuri>')
    .option('--nodeselector <nodeselector>')
    .option('-p, --path <path>')
    .option('-n, --jobname <jobname>', 'Name of job')
    .option('-t, --timeout <timeout>', 'Maximum time job should be allowed to run', parseInt)
    .option('-q, --queue <queue>', 'Name of queue to send job to. defaults to: tilloo.worker')
    .option('-a, --jobargs <jobargs>', 'List of args', list)
    .option('-d, --jobdescription <jobdescription>', 'Job description')
    .option('-m, --mutex <mutex>', 'False to run job if already running. defaults to true')
    .option('-e, --enabled <enabled>', 'true or false')
    .option('-f, --failures <failures>', 'Number of failures before alert is sent', parseInt)
    .parse(process.argv);

const options = commander.opts();

function showHelpAndExit() {
    commander.outputHelp();
    process.exit(1);
}

const jobId = commander.args[0];

if (!jobId) {
    console.error('Must specify jobId');
    showHelpAndExit();
}

(async () => {
    try {
        const jobDef = {};

        if (options.enabled) {
            jobDef.enabled = options.enabled.toLowerCase() === 'true';
        }

        if (options.schedule) {
            jobDef.schedule = options.schedule;
        }

        if (options.path) {
            jobDef.path = options.path;
        }

        if (options.imageuri) {
            jobDef.imageUri = options.imageuri;
        }

        if (options.nodeselector) {
            jobDef.nodeSelector = options.nodeselector;
        }

        if (options.jobname) {
            jobDef.name = options.jobname;
        }

        if (options.timeout) {
            jobDef.timeout = options.timeout;
        }

        if (options.queue) {
            jobDef.queueName = options.queue;
        }

        if (options.jobargs) {
            jobDef.args = options.jobargs;
        }

        if (options.jobdescription) {
            jobDef.description = options.jobdescription;
        }

        if (options.mutex !== undefined) {
            jobDef.mutex = options.mutex;
        }

        if (options.failures) {
            jobDef.failuresBeforeAlert = options.failures;
        }

        await jobs.update(jobId, jobDef);
        console.info('Job updated');
        process.exit(0);
    }
    catch (err) {
        console.error('Error updating job err:', err);
        process.exit(1);
    }
})();
