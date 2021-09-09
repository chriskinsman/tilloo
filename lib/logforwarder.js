'use strict';

const debug = require('debug')('tilloo:logforwarder');
const Tail = require('tail').Tail;
const rabbit = require('./rabbitfactory');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Log = require('../models/log');

debug(`publishing to ${config.rabbitmq.host}:${config.rabbitmq.port}, queue: ${constants.QUEUES.LOGGER}`);

async function getRestartMaxDate(restart, runId) {
    try {
        if (restart) {
            debug(`Getting max createdAt for runId: ${runId}`);
            const log = await Log.getMaxCreatedAtForRun(runId);
            if (!log) {
                debug(`No log rows found for ${runId}`);
            }
            else {
                debug(`runId: ${runId}, max(createdAt): ${log.createdAt}`);

                return log.createdAt;
            }
        }
        else {
            debug(`runId: ${runId} not a restart`);
        }
    }
    catch (err) {
        console.error('Error getting restart max date', err);
        throw new Error('Error getting restart max date');
    }
}

function selectParser(rawLine) {
    debug('Checking line format');
    debug(rawLine);
    if (rawLine.startsWith('{')) {
        debug('docker parser');
        return parseDockerLine;
    }
    else {
        debug('containerd parser');
        return parseContainerdLine;
    }
}

function parseDockerLine(rawLine) {
    return JSON.parse(rawLine);
}

function parseContainerdLine(rawLine) {
    return {
        time: rawLine.substr(0, 30),
        log: rawLine
    };
}

class LogForwarder {
    constructor(runId, filePath, restart) {
        this.runId = runId;
        this.filePath = filePath;
        this.restart = restart;
        this.maxLogDate = null;
        this.checkedLogFormat = false;
        // Default to true for Docker
        this.lineParser = null;
    }

    async start() {
        const self = this;
        try {
            self.maxLogDate = await getRestartMaxDate(this.restart, this.runId);
        }
        catch (e) {
            // Just go with a null max log date
        }

        try {
            self.tail = new Tail(self.filePath, { fromBeginning: true, follow: true });
            self.tail.on('line', function (rawLine) {
                if (!self.checkedLogFormat) {
                    self.lineParser = selectParser(rawLine);
                    self.checkedLogFormat = true;
                }

                const line = self.lineParser(rawLine);
                const lineTime = new Date(line.time);
                if (!self.maxLogDate || self.maxLogDate < lineTime) {
                    // Set to null to short circuit the date conversion above after we get new lines
                    self.maxLogDate = null;
                    debug(`runId: ${self.runId} - ${rawLine}`);
                    const message = { runId: self.runId, createdAt: lineTime, output: line.log };
                    rabbit.publish(constants.QUEUES.LOGGER, message).catch((err) => {
                        console.error(`Unable to queue output for runId: ${message.runId}, output: ${message.output}`);
                    });
                }
                else {
                    debug(`Skipping already logged line runId: ${self.runId} - ${rawLine}`);
                }
            });

            self.tail.on('error', function (err) {
                console.error(`tailing runId: ${self.runId} err: `, err);
            });
        }
        catch (e) {
            console.error(`Error tailing: ${self.filePath}`, e);
        }
    }

    stop() {
        if (this.tail) {
            this.tail.unwatch();
        }
    }

}

module.exports = LogForwarder;