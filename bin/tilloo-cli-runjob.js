#! /usr/bin/env node
'use strict';

const commander = require('commander');

const jobs = require('../lib/jobs');

commander.version('0.0.1')
    .usage('<jobId>')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.outputHelp();
    process.exit(1);
}


(async () => {
    try {
        await jobs.triggerRun(commander.args[0]);
        console.info('Run triggered');
        process.exit(0);
    }
    catch (err) {
        console.error('Unable to trigger run err: ' + err);
        process.exit(1);
    }
})();

