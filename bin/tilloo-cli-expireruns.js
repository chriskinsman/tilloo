#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const commander = require('commander');

const config = require('../lib/config');
const runs = require('../lib/runs');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

commander.version('0.0.1')
    .usage('<days>', 'Expire jobs created <days> ago', parseInt)
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

runs.deleteRunsOlderThan(commander.args[0], function (err) {
    if (err) {
        console.error('Problems expiring runs err: ' + err);
        process.exit(1);
    }
    else {
        console.info('Expired');
        process.exit(0);
    }
});
