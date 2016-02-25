'use strict';

var util = require('util');

var DisqEventEmitter = require('disque-eventemitter');

var config = require('../lib/config');
var constants = require('../lib/constants');
var Log = require('../models/log');
var iostatus = require('./iostatus');

var debug = require('debug')('tilloo:logger');

var ee = new DisqEventEmitter(config.disque, constants.QUEUES.LOGGER, {concurrency: 10});
ee.on('job', function(job, done) {
    var message = JSON.parse(job.body);
    debug('logger message', message);
    if(message && message.runId && message.output) {
        iostatus.sendLogOutput(message.runId, message.output);
        Log.append(message.runId, message.output, message.createdAt, function(err) {
            if(!err) {
                ee.ack(job, function(err) {
                    if(err) {
                        console.error(err);
                    }
                });
            }

            done();
        });
    }
    else {
        debug('Invalid logger job: ', job);
        // TODO: Instead of acking dead-letter it
        ee.ack(job, function(err) {
            if(err) {
                console.error(err);
            }
            done();
        });
    }
});