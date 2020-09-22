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

(async () => {
    try {
        const runOutputs = await Log.findOutputForRun(commander.args[0]);
        runOutputs.forEach((runOutput) => {
            console.info(runOutput.output);
        });
        process.exit(0);
    }
    catch (err) {
        console.error('Error getting run output err: ' + err);
        process.exit(1);
    }
})();

