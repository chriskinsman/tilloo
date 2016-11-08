#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var commander = require('commander');

var config = require('../lib/config');
var jobs = require('../lib/jobs');

mongoose.connect(config.db);

function list(val) {
    return val.split(',');
}

commander.version('0.0.1')
    .usage('<jobid> [options]')
    .option('-s, --schedule <schedule>', 'Schedule in cron form')
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


function showHelpAndExit() {
    commander.outputHelp();
    process.exit(1);
}

var jobId = commander.args[0];

if(!jobId) {
    console.error('Must specify jobId');
    showHelpAndExit();
}

var jobDef = {};

if(commander.enabled) {
    jobDef.enabled = commander.enabled.toLowerCase() === 'true';
}

if(commander.schedule) {
    jobDef.schedule = commander.schedule;
}

if(commander.path) {
    jobDef.path = commander.path;
}

if(commander.jobname) {
    jobDef.name = commander.jobname;
}

if(commander.timeout) {
    jobDef.timeout = commander.timeout;
}

if(commander.queue) {
    jobDef.queueName = commander.queue;
}

if(commander.jobargs) {
    jobDef.args = commander.jobargs;
}

if(commander.jobdescription) {
    jobDef.description = commander.jobdescription;
}

if(commander.mutex !== undefined) {
    jobDef.mutex = commander.mutex;
}

if(commander.failures) {
    jobDef.failuresBeforeAlert = commander.failures;
}

jobs.update(jobId, jobDef, function(err) {
    if(err) {
        console.error('Error updating job err:', err);
        process.exit(1);
    }
    else {
        console.info('Job updated');
        process.exit(0);
    }
});
