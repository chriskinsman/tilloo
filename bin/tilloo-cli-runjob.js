#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const commander = require('commander');

const config = require('../lib/config');
const jobs = require('../lib/jobs');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

commander.version('0.0.1')
    .usage('<jobId>')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.outputHelp();
    process.exit(1);
}

jobs.triggerRun(commander.args[0], function(err) {
    if(err) {
        console.error('Unable to trigger run err: ' + err);
        process.exit(1);
    }
    else {
        console.info('Run triggered');
        process.exit(0);
    }
});
