#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const commander = require('commander');
const Table = require('easy-table');
const moment = require('moment');

const config = require('../lib/config');
const Run = require('../models/run');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.Promise = global.Promise;
mongoose.connect(config.db);

commander.version('0.0.1')
    .usage('<jobId>', 'Id of job')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}


const table = new Table();
Run.findRunsForJob(commander.args[0], { startedAt: 1 }, function (err, runs) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    else {
        runs.forEach(function (run) {
            table.cell('Id', run._id);
            table.cell('Worker', run.worker);
            table.cell('Pod', run.pod);
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