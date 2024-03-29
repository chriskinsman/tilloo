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
                if (message.k8s) {
                    // k8s event watchers get repetitive messages.  This de-duplicates
                    // by assuming the tuple of runId, output and createdAt are all unique and if not, inserts them
                    await Log.upsert(message.runId, message.output, message.createdAt);
                }
                else {
                    await Log.append(message.runId, message.output, message.createdAt);
                }

                return true;
            }
            catch (err) {
                console.error('logwriter:start err', err);
            }
        }
        else {
            debug('Invalid logger message: ', message);
        }

        return true;
    });
};