#! /usr/bin/env node
'use strict';

const Table = require('easy-table');
const moment = require('moment');

const Job = require('../models/job');

const table = new Table();
Job.find({ deleted: false }, null, { sort: { name: 1 } }, function (err, jobs) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    else {
        jobs.forEach(function (job) {
            table.cell('Id', job._id);
            table.cell('Name', job.name);
            table.cell('Schedule', job.schedule);
            table.cell('Enabled', job.enabled);
            table.cell('Node Selector', job.nodeSelector);
            table.cell('Last Ran', job.lastRanAt ? moment(job.lastRanAt).format('l LTS') : '');
            table.cell('Last Status', job.lastStatus);
            table.newRow();
        });

        console.log(table.toString());
        process.exit(0);
    }
});