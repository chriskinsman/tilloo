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

(async () => {
    try {
        await jobs.remove(commander.args[0]);
        console.info('Deleted');
        process.exit(0);
    }
    catch (err) {
        console.error('Problems deleting job err: ' + err);
        process.exit(1);
    }
})();


