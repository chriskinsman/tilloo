#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const commander = require('commander');

const config = require('../lib/config');
const Run = require('../models/run');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.Promise = global.Promise;
mongoose.connect(config.db);

commander.version('0.0.1')
    .usage('<runId>', 'Id of run')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

Run.findByRunId(commander.args[0], function (err, run) {
    if (err) {
        console.error('Error getting job detail err: ' + err);
        process.exit(1);
    }
    else {
        console.info(JSON.stringify(run, null, 4));
        process.exit(0);
    }

});
