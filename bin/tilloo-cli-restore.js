#! /usr/bin/env node
'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const commander = require('commander');
const async = require('async');

const config = require('../lib/config');
const jobs = require('../lib/jobs');
const Job = require('../models/job');

mongoose.connect(config.db, { useMongoClient: true });
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
            const restoreJobs = JSON.parse(data);
            let errors = false;
            let jobAdded = 0;
            let jobUpdated = 0;
            async.eachSeries(restoreJobs, function(jobToRestore, done) {
                Job.findById(new ObjectId(jobToRestore._id), function(err, job) {
                    if(!job) {
                        // Remove the id so we generate a new one
                        delete jobToRestore._id;
                        jobs.add(jobToRestore, function(err) {
                            if (err) {
                                errors = true;
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
                            if (err) {
                                errors = true;
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
