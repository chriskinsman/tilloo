#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const commander = require('commander');

const config = require('../lib/config');
const runs = require('../lib/runs');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

commander.version('0.0.1')
    .usage('<runId>')
    .option('-f, --force', 'Force kill a job.  Immediately sets status in mongodb to fail')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.outputHelp();
    process.exit(1);
}

runs.killRun(commander.args[0], commander.force, function(err) {
    if (err) {
        console.error('Unable to kill run');
        process.exit(1);
    }
    else {
        console.info('Kill message sent');
        process.exit(0);
    }

});
