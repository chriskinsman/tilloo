'use strict';

const rabbit = require('../lib/rabbitFactory');

const config = require('../lib/config');
const constants = require('../lib/constants');
const Log = require('../models/log');
const iostatus = require('./iostatus');
const util = require('util');

const debug = require('debug')('tilloo:logwriter');

const logAppend = util.promisify(Log.append);

console.info(`Listening to ${config.rabbitmq.host}:${config.rabbitmq.port} queue: ${constants.QUEUES.LOGGER}`);
rabbit.subscribe(constants.QUEUES.LOGGER, async (message) => {
    debug('logger message', message);
    if (message && message.runId && message.output) {
        iostatus.sendLogOutput(message.runId, message.output);
        try {
            await logAppend(message.runId, message.output, message.createdAt);

            return true;
        }
        catch (err) {
            console.error(err);

            return false;
        }
    }
    else {
        debug('Invalid logger message: ', message);

        return false;
    }
});