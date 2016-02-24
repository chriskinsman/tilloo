#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
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

Job.findById(new ObjectId(jobId), function(err, dbJob) {
    if(err || !dbJob) {
        console.error('Job not found', err);
        process.exit(1);
    }
    else {
        var action = 'updated';
        if(commander.enabled) {
            dbJob.enabled = commander.enabled.toLowerCase() === 'true';
            // Change the action to deleted so the scheduler
            // drops it
            if(!dbJob.enabled) {
                action = 'deleted';
            }
        }

        if(commander.schedule) {
            dbJob.schedule = commander.schedule;
        }

        if(commander.path) {
            dbJob.path = commander.path;
        }

        if(commander.jobname) {
            dbJob.name = commander.jobname;
        }

        if(commander.timeout) {
            dbJob.timeout = commander.timeout;
        }

        if(commander.queue) {
            dbJob.queueName = commander.queue;
        }

        if(commander.jobargs) {
            dbJob.args = commander.jobargs;
        }

        if(commander.jobdescription) {
            dbJob.description = commander.jobdescription;
        }

        if(commander.mutex !== undefined) {
            dbJob.mutex = commander.mutex;
        }

        dbJob.save(function(err, dbJob) {
            if(err) {
                console.error(err);
                process.exit(1);
            }
            else {
                var message = {jobId: jobId,action: action};
                disq.addJob({queue: constants.QUEUES.SCHEDULER, job: JSON.stringify(message), timeout: 0}, function(err) {
                    if(err) {
                        console.error(err);
                    }
                    console.info('Job updated');
                    process.exit(0);
                });
            }
        });
    }
});

