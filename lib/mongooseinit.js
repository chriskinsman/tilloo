'use strict';

const config = require('./config');
const debug = require('debug')('tilloo:mongooseinit');

const mongoose = require('mongoose');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
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

