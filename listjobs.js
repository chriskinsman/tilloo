#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var Table = require('easy-table');

var config = require('./lib/config');
var Job = require('./models/job');

mongoose.connect(config.db);

var table = new Table();
Job.find({deleted: false}, null, {sort: {name: 1}}, function(err, jobs) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        jobs.forEach(function(job) {
            table.cell('Id', job._id);
            table.cell('Name', job.name);
            table.cell('Schedule', job.schedule);
            table.cell('Enabled', job.enabled);
            table.cell('Timeout', job.timeout);
            table.cell('Queue', job.queueName);
            table.cell('Path', job.path);
            table.cell('Args', job.args.join(' '));
            table.cell('Last Ran', job.lastRanAt);
            table.cell('Last Status', job.lastStatus);
            table.newRow();
        });

        console.log(table.toString());
        process.exit(0);
    }
});