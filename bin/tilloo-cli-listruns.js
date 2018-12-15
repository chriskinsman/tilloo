#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var commander = require('commander');
var Table = require('easy-table');
var moment = require('moment');

var config = require('../lib/config');
var Run = require('../models/run');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

commander.version('0.0.1')
    .usage('<jobId>', 'Id of job')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}


var table = new Table();
Run.findRunsForJob(commander.args[0], {startedAt: 1}, function(err, runs) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        runs.forEach(function(run) {
            table.cell('Id', run._id);
            table.cell('Worker', run.worker);
            table.cell('PID', run.pid);
            table.cell('Result', run.result);
            table.cell('Started', moment(run.startedAt).format('l LTS'));
            table.cell('Completed', moment(run.completedAt).format('l LTS'));
            table.cell('Status', run.status);
            table.newRow();
        });

        console.log(table.toString());
        process.exit(0);
    }
});