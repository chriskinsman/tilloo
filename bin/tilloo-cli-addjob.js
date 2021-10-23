#! /usr/bin/env node
'use strict';

const commander = require('commander');
const jobs = require('../lib/jobs');

function list(val) {
    return val.split(',');
}

commander.version('0.0.1')
    .usage('<schedule> <imageuri> [options]')
    .option('-n, --jobname <jobname>', 'Name of job')
    .option('-p, --path <path>', 'Path to command to run')
    .option('-t, --timeout <timeout>', 'Maximum time job should be allowed to run', parseInt)
    //.option('-q, --queue <queue>', 'Name of queue to send job to. defaults to: tilloo.worker')
    .option('--nodeselector <nodeselector>', 'Optional nodeSelector for pod affinity when scheduling name:value')
    .option('-a, --jobargs <jobargs>', 'List of args', list)
    .option('-d, --jobdescription <jobdescription>', 'Job description')
    .option('-m, --mutex <mutex>', 'False to run job if already running. defaults to true')
    .option('-f, --failures <failures>', 'Number of failures before alert is sent', parseInt)
    .parse(process.argv);

const options = commander.opts();

function showHelpAndExit() {
    commander.outputHelp();
    process.exit(1);
}


const schedule = options.args[0];
const imageUri = options.args[1];

if (!schedule) {
    console.error('Must specify schedule');
    showHelpAndExit();
}

if (!imageUri) {
    console.error('Must specify imageUri');
    showHelpAndExit();
}

(async () => {
    try {
        const jobDef = { schedule: schedule, imageUri: imageUri };

        if (options.path) {
            jobDef.path = options.path;
        }

        if (options.nodeselector) {
            jobDef.nodeSelector = options.nodeselector;
        }

        if (options.jobname) {
            jobDef.name = options.jobname;
        }
        else {
            jobDef.name = imageUri;
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

        await jobs.add(jobDef);
        console.info('Job added');
        process.exit(0);
    }
    catch (err) {
        console.error('Error adding job err: ', err);
        process.exit(1);
    }
})();
