'use strict';

var mongoose = require('mongoose');
var commander = require('commander');
var Disqueue = require('disqueue-node');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Job = require('./models/job');

mongoose.connect(config.db);
var disq = new Disqueue(config.disque);

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

var job = new Job({schedule: schedule, path: path});

if(commander.jobname) {
    job.name = commander.jobname;
}
else {
    job.name = path;
}

if(commander.timeout) {
    job.timeout = commander.timeout;
}

if(commander.queue) {
    job.queueName = commander.queue;
}

if(commander.jobargs) {
    job.args = commander.jobargs;
}

if(commander.jobdescription) {
    job.description = commander.jobdescription;
}

if(commander.mutex !== undefined) {
    job.mutex = commander.mutex;
}

job.save(function(err, dbJob) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        var message = {jobId: dbJob._id,action: 'new'};
        disq.addJob({queue: constants.QUEUES.SCHEDULER, job: JSON.stringify(message), timeout: 0}, function(err) {
            if(err) {
                console.error(err);
            }
            console.info('Job added');
            process.exit(0);
        });
    }
});