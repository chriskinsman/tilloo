#! /usr/bin/env node
'use strict';

var fs = require('fs');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var commander = require('commander');
var async = require('async');

var config = require('../lib/config');
var jobs = require('../lib/jobs');
var Job = require('../models/job');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

commander.version('0.0.1')
    .usage('<file>')
    .parse(process.argv);

function showHelpAndExit() {
    commander.outputHelp();
    process.exit(1);
}

if(commander.args.length !== 1) {
    showHelpAndExit();
}

// Attempt to open file
fs.readFile(commander.args[0], function(err, data) {
    if(err) {
        console.error('Unable to open: ' + commander.args[0]);
        process.exit(1);
    }
    else {
        try {
            var restoreJobs = JSON.parse(data);
            var errors = false;
            var jobAdded = 0;
            var jobUpdated = 0;
            async.eachSeries(restoreJobs, function(jobToRestore, done) {
                Job.findById(new ObjectId(jobToRestore._id), function(err, job) {
                    if(!job) {
                        // Remove the id so we generate a new one
                        delete jobToRestore._id;
                        jobs.add(jobToRestore, function(err) {
                            if(err) {
                                console.error('Problem adding job: ');
                                console.dir(jobToRestore);
                            }
                            else {
                                jobAdded++;
                            }
                            done();
                        });
                    }
                    else {
                        jobs.update(jobToRestore._id, jobToRestore, function(err) {
                            if(err) {
                                console.error('Problem updating job: ');
                                console.dir(jobToRestore);
                            }
                            else {
                                jobUpdated++;
                            }
                            done();
                        });
                    }
                });
            }, function(err) {
                if(errors) {
                    console.error('Jobs restored with errors');
                    process.exit(1);
                }
                else {
                    console.info('Jobs added: ' + jobAdded + ', updated: ' + jobUpdated);
                    process.exit(0);
                }
            });
        }
        catch(e) {
            console.error(e);
            console.error('Unable to parse job data for file: ' + commander.args[0]);
            process.exit(1);
        }

    }
});
