#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const commander = require('commander');

const config = require('../lib/config');
const jobs = require('../lib/jobs');

mongoose.connect(config.db);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.Promise = global.Promise;

commander.version('0.0.1')
    .usage('<id>', 'Id of job')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

jobs.remove(commander.args[0], function (err) {
    if (err) {
        console.error('Problems deleting job err: ' + err);
        process.exit(1);
    }
    else {
        console.info('Deleted');
        process.exit(0);
    }
});
