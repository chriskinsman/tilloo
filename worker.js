'use strict';

var util = require('util');

var DisqEventEmitter = require('disque-eventemitter');
var mongoose = require('mongoose');
var Disqueue = require('disqueue-node');
var commander = require('commander');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Script = require('./lib/script');

var disq = new Disqueue(config.disque);
mongoose.connect(config.db);
var debuglog = util.debuglog('TILLOO');

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
        debuglog('Received job', message);

        var script = new Script(job.jobId, message.runId, message.path, message.args, message.timeout);
        script.on('output', function(message) {
            debuglog(message.output);
            disq.addJob({queue: constants.QUEUES.LOGGER, job: JSON.stringify(message), timeout: 0}, function(err) {
                if(err) {
                    console.error('Unable to queue output for jobId: %s, runId: %s, output: %s', job.jobId, message.runId, message.output);
                }
            });
        });

        script.on('status', function(message) {
            debuglog('Updating status for jobId: %s, runId: %s', job.jobId, message.runId, message);
            disq.addJob({queue: constants.QUEUES.STATUS, job: JSON.stringify(message), timeout: 0}, function(err) {
                if(err) {
                    console.error('Unable to queue status for jobId: %s, runId: %s, status: %s', job.jobId, message.runId, message);
                }
            })
        });

        script.on('complete', function() {
            done();
        });

        // Start script
        script.start();
    });
});

