'use strict';

var util = require('util');
var os = require('os');


var DisqEventEmitter = require('disque-eventemitter');
var mongoose = require('mongoose');
var Disqueue = require('disqueue-node');
var commander = require('commander');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Script = require('./lib/script');

var disq = new Disqueue(config.disque);
mongoose.connect(config.db);
var debug = require('debug')('tilloo:worker');

var _runningScripts = {};

var workername = os.hostname() + ':' + process.pid;

commander.version('0.0.1')
    .option('-q, --queue <queue>', 'Name of queue to process. defaults to tilloo.worker')
    .parse(process.argv);

var queue = constants.QUEUES.DEFAULT_WORKER;
if(commander.queue) {
    queue = commander.queue;
}

console.info('Listening to %s:%d queue: %s', config.disque.host, config.disque.port, queue);

var ee = new DisqEventEmitter(config.disque, queue, {concurrency: 10});
ee.on('job', function(job, done) {
    ee.ack(job, function(err) {
        if(err) {
            console.error(err);
        }
        var message = JSON.parse(job.body);
        debug('Received job', message);

        var script = new Script(job.jobId, message.runId, message.path, message.args, message.timeout);
        script.on('output', function(message) {
            debug(message.output);
            message.createdAt = new Date();
            disq.addJob({queue: constants.QUEUES.LOGGER, job: JSON.stringify(message), timeout: 0}, function(err) {
                if(err) {
                    console.error('Unable to queue output for jobId: %s, runId: %s, output: %s', job.jobId, message.runId, message.output);
                }
            });
        });

        script.on('status', function(message) {
            debug('Updating status for jobId: %s, runId: %s', job.jobId, message.runId, message);
            message.workername = workername;
            disq.addJob({queue: constants.QUEUES.STATUS, job: JSON.stringify(message), timeout: 0}, function(err) {
                if(err) {
                    console.error('Unable to queue status for jobId: %s, runId: %s, status: %s', job.jobId, message.runId, message);
                }
            });
        });

        var runningPid;
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
var killQueue = constants.QUEUES.KILL_PREFIX + workername;
console.info('Listening to %s:%d queue: %s', config.disque.host, config.disque.port, killQueue);
var killee = new DisqEventEmitter(config.disque, killQueue);
killee.on('job', function(job, done) {
    killee.ack(job, function (err) {
        if (err) {
            console.error(err);
        }

        var message = JSON.parse(job.body);
        debug('Received kill', message);

        if(_runningScripts[message.pid]) {
            debug('Killing pid: %d', message.pid);
            _runningScripts[message.pid].stop();
            done();
        }
        else {
            // Running job not found so send back a fail status
            debug('pid: %d not found sending fail status', message.pid);
            disq.addJob({queue: constants.QUEUES.STATUS, job: JSON.stringify({status:'fail'}), timeout: 0}, function(err) {
                if(err) {
                    console.error('Unable to queue status for jobId: %s, runId: %s, status: %s', job.jobId, message.runId, message);
                }
                done();
            });
        }
    });
});
