#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const commander = require('commander');

const config = require('../lib/config');
const Log = require('../models/log');

mongoose.connect(config.db, { useMongoClient: true });
mongoose.Promise = global.Promise;

commander.version('0.0.1')
    .usage('<runId>', 'Id of run')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

Log.findOutputForRun(commander.args[0], function(err, runOutputs) {
    if(err) {
        console.error('Error getting job detail err: ' + err);
        process.exit(1);
    }
    else {
        runOutputs.forEach(function(runOutput) {
            console.info(runOutput.output);
        });
        process.exit(0);
    }

});
