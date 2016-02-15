'use strict';

var DisqEventEmitter = require('disque-eventemitter');

var constants = require('./lib/constants');

var ee = new DisqEventEmitter({host:'127.0.0.1', port:7711}, constants.QUEUES.LOGGER, {concurrency: 10});
ee.on('job', function(job, done) {
    ee.ack(job.jobId, function(err) {
        if(err) {
            console.error(err);
        }
        done();
    });
});
