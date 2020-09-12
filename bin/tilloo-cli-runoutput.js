#! /usr/bin/env node
'use strict';

const commander = require('commander');

const Log = require('../models/log');

commander.version('0.0.1')
    .usage('<runId>', 'Id of run')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

Log.findOutputForRun(commander.args[0], function (err, runOutputs) {
    if (err) {
        console.error('Error getting job detail err: ' + err);
        process.exit(1);
    }
    else {
        runOutputs.forEach(function (runOutput) {
            console.info(runOutput.output);
        });
        process.exit(0);
    }

});
