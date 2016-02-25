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
    .usage('<schedule> <path> [options]')
    .option('-n, --jobname <jobname>', 'Name of job')
    .option('-t, --timeout <timeout>', 'Maximum time job should be allowed to run', parseInt)
    .option('-q, --queue <queue>', 'Name of queue to send job to. defaults to: tilloo.worker')
    .option('-a, --jobargs <jobargs>', 'List of args', list)
    .option('-d, --jobdescription <jobdescription>', 'Job description')
    .option('-m, --mutex <mutex>', 'False to run job if already running. defaults to true')
    .parse(process.argv);


function showHelpAndExit() {
    commander.outputHelp();
    process.exit(1);
}


var schedule = commander.args[0];
var path = commander.args[1];

if(!schedule) {
    console.error('Must specify schedule');
    showHelpAndExit();
}

if(!path) {
    console.error('Must specify path');
    showHelpAndExit();
}

var jobDef = {schedule: schedule, path: path};

if(commander.jobname) {
    jobDef.name = commander.jobname;
}
else {
    jobDef.name = path;
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

jobs.add(jobDef, function(err) {
    if(err) {
        console.error('Error adding job err: ', err);
        process.exit(1);
    }
    else {
        console.info('Job added');
        process.exit(0);
    }
});