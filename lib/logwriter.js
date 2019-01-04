'use strict';

const DisqEventEmitter = require('disque-eventemitter');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Log = require('../models/log');
const iostatus = require('./iostatus');

const debug = require('debug')('tilloo:logwriter');

console.info('Listening to %s:%d queue: %s', config.disque.host, config.disque.port, constants.QUEUES.LOGGER);
const ee = new DisqEventEmitter(config.disque, constants.QUEUES.LOGGER, { concurrency: 10 });
ee.on('job', function(job, done) {
    const message = JSON.parse(job.body);
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
        ee.ack(job, function(err) {
            if(err) {
                console.error(err);
            }
            done();
        });
    }
});