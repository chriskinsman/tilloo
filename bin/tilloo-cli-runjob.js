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

jobs.triggerRun(commander.args[0], function (err) {
    if (err) {
        console.error('Unable to trigger run err: ' + err);
        process.exit(1);
    }
    else {
        console.info('Run triggered');
        process.exit(0);
    }
});
