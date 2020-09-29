'use strict';

const rabbit = require('./rabbitfactory');

const constants = require('../lib/constants');
const Log = require('../models/log');
const iostatus = require('./iostatus');

const debug = require('debug')('tilloo:logwriter');

module.exports.start = function start() {
    rabbit.subscribe(constants.QUEUES.LOGGER, async (message) => {
        debug('logger message', message);
        if (message && message.runId && message.output) {
            iostatus.sendLogOutput(message.runId, message.output);
            try {
                await Log.append(message.runId, message.output, message.createdAt);

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
};