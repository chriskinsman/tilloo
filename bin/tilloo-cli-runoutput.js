#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var commander = require('commander');

var config = require('../lib/config');
var Log = require('../models/log');

mongoose.connect(config.db);

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
