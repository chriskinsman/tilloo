'use strict';

const config = require('./config');
const debug = require('debug')('tilloo:mongooseinit');

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

if (!process.env.DOCKER_BUILD) {
    (async () => {
        try {
            await mongoose.connect(config.db);
            debug('Connected to cluster: ', config.db);
        }
        catch (e) {
            console.error('Unable to connect to mongoose', e);
            process.exit(1);
        }
    })();
}

module.exports = mongoose;

