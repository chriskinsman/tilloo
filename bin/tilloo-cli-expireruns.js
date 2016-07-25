#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var commander = require('commander');

var config = require('../lib/config');
var runs = require('../lib/runs');

mongoose.connect(config.db);

commander.version('0.0.1')
    .usage('<days>', 'Expire jobs created <days> ago', parseInt)
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

runs.deleteRunsOlderThan(commander.args[0], function(err) {
    if(err) {
        console.error('Problems expiring runs err: ' + err);
        process.exit(1);
    }
    else {
        console.info('Expired');
        process.exit(0);
    }
});
