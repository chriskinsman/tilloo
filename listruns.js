'use strict';

var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var commander = require('commander');
var Table = require('easy-table');

var config = require('./lib/config');
var Run = require('./models/run');

mongoose.connect(config.db);

commander.version('0.0.1')
    .usage('<id>', 'Id of job')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}


var table = new Table();
Run.find({jobId: new ObjectId(commander.args[0])}, null, {sort: {startedAt: 1}}, function(err, runs) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        runs.forEach(function(run) {
            table.cell('Id', run._id);
            table.cell('Path', run.path);
            table.cell('Queue', run.queueName);
            table.cell('Status', run.status);
            table.cell('PID', run.pid);
            table.cell('Result', run.result);
            table.cell('Started', run.startedAt);
            table.cell('Completed', run.completedAt);
            table.newRow();
        });

        console.log(table.toString());
        process.exit(0);
    }
});