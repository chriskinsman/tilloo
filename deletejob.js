#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var commander = require('commander');
var Disqueue = require('disqueue-node');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Job = require('./models/job');

mongoose.connect(config.db);
var disq = new Disqueue(config.disque);

commander.version('0.0.1')
    .usage('<id>', 'Id of job')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

Job.findByIdAndUpdate(new ObjectId(commander.args[0]), {deleted: true}, function(err) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        var message = {jobId: commander.args[0],action: 'deleted'};
        disq.addJob({queue: constants.QUEUES.SCHEDULER, job: JSON.stringify(message), timeout: 0}, function(err) {
            if (err) {
                console.error(err);
            }

            console.info('Deleted');
            process.exit(0);
        });
    }
});