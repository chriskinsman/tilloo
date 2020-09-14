#! /usr/bin/env node
'use strict';

const commander = require('commander');

const Job = require('../models/job');

commander.version('0.0.1')
    .usage('<jobId>', 'Id of job')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

Job.findByJobId(commander.args[0], function (err, job) {
    if (err) {
        console.error('Error getting job detail err: ' + err);
        process.exit(1);
    }
    else {
        console.info(JSON.stringify(job, null, 4));
        process.exit(0);
    }

});
