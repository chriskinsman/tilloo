#! /usr/bin/env node
'use strict';

const commander = require('commander');

const jobs = require('../lib/jobs');

commander.version('0.0.1')
    .usage('<id>', 'Id of job')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

jobs.remove(commander.args[0], function (err) {
    if (err) {
        console.error('Problems deleting job err: ' + err);
        process.exit(1);
    }
    else {
        console.info('Deleted');
        process.exit(0);
    }
});
