'use strict';

const debug = require('debug')('tilloo:logforwarder');
const mongoose = require('mongoose');
const Tail = require('tail').Tail;
const rabbit = require('./rabbitFactory');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Log = require('../models/log');

console.info(`Logforwarder connecting to ${config.rabbitmq.host}:${config.rabbitmq.port}, queue: ${constants.QUEUES.LOGGER}`);
mongoose.connect(config.db);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.Promise = global.Promise;

function getRestartMaxDate(restart, runId, callback) {
    if (restart) {
        debug(`Getting max createdAt for runId: ${runId}`);
        Log.getMaxCreatedAtForRun(runId, function (err, log) {
            if (err) {
                console.error('Error getting restart max date', err);
                callback(null, null);
            }
            else if (!log) {
                debug(`No log rows found for ${runId}`);
                callback(null, null);
            }
            else {
                debug(`runId: ${runId}, max(createdAt): ${log.createdAt}`);
                callback(null, log.createdAt);
            }
        });
    }
    else {
        debug(`runId: ${runId} not a restart`);
        callback(null, null);
    }
}

class LogForwarder {
    constructor(runId, filePath, restart) {
        this.runId = runId;
        this.filePath = filePath;
        this.restart = restart;
        this.maxLogDate = null;
    }

    start() {
        const self = this;
        getRestartMaxDate(this.restart, this.runId, function (err, maxLogDate) {
            self.maxLogDate = maxLogDate;

            self.tail = new Tail(self.filePath, { fromBeginning: true, follow: true });
            self.tail.on('line', function (lineJson) {
                const line = JSON.parse(lineJson);
                const lineTime = new Date(line.time);
                if (!self.maxLogDate || self.maxLogDate < lineTime) {
                    // Set to null to short circuit the date conversion above after we get new lines
                    self.maxLogDate = null;
                    debug(`runId: ${self.runId} - ${lineJson}`);
                    const message = { runId: self.runId, createdAt: lineTime, output: line.log };
                    rabbit.publish(constants.QUEUES.LOGGER, message).catch((err) => {
                        console.error(`Unable to queue output for runId: ${message.runId}, output: ${message.output}`);
                    });
                }
                else {
                    debug(`Skipping already logged line runId: ${self.runId} - ${lineJson}`);
                }
            });

            self.tail.on('error', function (err) {
                console.error(`tailing runId: ${self.runId} err: `, err);
            });
        });
    }

    stop() {
        if (this.tail) {
            this.tail.unwatch();
        }
    }

}

module.exports = LogForwarder;