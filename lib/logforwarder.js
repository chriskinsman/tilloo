'use strict';

const debug = require('debug')('tilloo:logforwarder');
const Disqueue = require('disqueue-node');
const mongoose = require('mongoose');
const Tail = require('tail').Tail;

const config = require('../lib/config');
const constants = require('../lib/constants');
const Log = require('../models/log');

console.info('Logforwarder connecting to %s:%d', config.disque.host, config.disque.port);
const disq = new Disqueue(config.disque);
mongoose.connect(config.db, { useMongoClient: true });
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
                    disq.addJob({ queue: constants.QUEUES.LOGGER, job: JSON.stringify(message), timeout: 0 }, function (err) {
                        if (err) {
                            console.error('Unable to queue output for runId: %s, output: %s', message.runId, message.output);
                        }
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