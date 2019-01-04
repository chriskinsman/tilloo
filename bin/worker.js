#! /usr/bin/env node
'use strict';

const os = require('os');

const DisqEventEmitter = require('disque-eventemitter');
const mongoose = require('mongoose');
const Disqueue = require('disqueue-node');
const commander = require('commander');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Script = require('../lib/script');

const disq = new Disqueue(config.disque);
mongoose.connect(config.db);
mongoose.Promise = global.Promise;
const debug = require('debug')('tilloo:worker');

const _runningScripts = {};

const workername = os.hostname() + ':' + process.pid;

commander.version('0.0.1')
    .option('-q, --queue <queue>', 'Name of queue to process. defaults to tilloo.worker')
    .option('-p, --parallel <parallel>', 'Number of parallel jobs to support.  Overrides default', parseInt)
    .parse(process.argv);

let queue = constants.QUEUES.DEFAULT_WORKER;
if(commander.queue) {
    queue = commander.queue;
}

let parallelJobs = config.worker.parallelJobs;
if(commander.parallel) {
    parallelJobs = commander.parallel;
}

console.info('Listening to %s:%d queue: %s parallel: %d', config.disque.host, config.disque.port, queue, parallelJobs);

const ee = new DisqEventEmitter(config.disque, queue, { concurrency: parallelJobs });
ee.on('job', function(job, done) {
    ee.ack(job, function(err) {
        if(err) {
            console.error(err);
        }
        const message = JSON.parse(job.body);
        debug('Received job', message);

        const script = new Script(message.jobId, message.runId, message.path, message.args, message.timeout);
        script.on('output', function(message) {
            debug(message.output);
            message.createdAt = new Date();
            disq.addJob({ queue: constants.QUEUES.LOGGER, job: JSON.stringify(message), timeout: 0 }, function(err) {
                if(err) {
                    console.error('Unable to queue output for jobId: %s, runId: %s, output: %s', message.jobId, message.runId, message.output);
                }
            });
        });

        script.on('status', function(message) {
            debug('Updating status for jobId: %s, runId: %s', message.jobId, message.runId, message);
            message.workername = workername;
            disq.addJob({ queue: constants.QUEUES.STATUS, job: JSON.stringify(message), timeout: 0 }, function(err) {
                if(err) {
                    console.error('Unable to queue status for jobId: %s, runId: %s, status: %s', message.jobId, message.runId, message);
                }
            });
        });

        let runningPid;
        script.on('pid', function(pid) {
            runningPid = pid;
            _runningScripts[runningPid] = script;
        });

        script.on('complete', function() {
            done();
        });

        // Start script
        script.start();
    });
});


// Listen on our worker name for kill messages
const killQueue = constants.QUEUES.KILL_PREFIX + workername;
console.info('Listening to %s:%d queue: %s', config.disque.host, config.disque.port, killQueue);
const killee = new DisqEventEmitter(config.disque, killQueue);
killee.on('job', function(job, done) {
    killee.ack(job, function (err) {
        if (err) {
            console.error(err);
        }

        const message = JSON.parse(job.body);
        debug('Received kill', message);

        if(_runningScripts[message.pid]) {
            debug('Killing pid: %d', message.pid);
            _runningScripts[message.pid].stop();
            done();
        }
        else {
            // Running job not found so send back a fail status
            debug('pid: %d not found sending fail status', message.pid);
            disq.addJob({ queue: constants.QUEUES.STATUS, job: JSON.stringify({ status:constants.JOBSTATUS.FAIL, type:constants.KILLTYPE.MANUAL }), timeout: 0 }, function(err) {
                if(err) {
                    console.error('Unable to queue status for jobId: %s, runId: %s, status: %s', job.jobId, message.runId, message);
                }
                done();
            });
        }
    });
});
