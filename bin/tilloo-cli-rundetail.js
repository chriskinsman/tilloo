#! /usr/bin/env node
'use strict';

const commander = require('commander');

const Run = require('../models/run');

commander.version('0.0.1')
    .usage('<runId>', 'Id of run')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

(async () => {
    try {
        const run = await Run.findByRunId(commander.args[0]);
        console.info(JSON.stringify(run, null, 4));
        process.exit(0);
    }
    catch (err) {
        console.error('Error getting job detail err: ' + err);
        process.exit(1);
    }
})();


