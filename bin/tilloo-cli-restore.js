#! /usr/bin/env node
'use strict';

const fs = require('fs').promises;
const mongoose = require('../lib/mongooseinit');
const ObjectId = mongoose.Types.ObjectId;
const commander = require('commander');
const async = require('async');

const jobs = require('../lib/jobs');
const Job = require('../models/job');

commander.version('0.0.1')
    .usage('<file>')
    .parse(process.argv);

function showHelpAndExit() {
    commander.outputHelp();
    process.exit(1);
}

if (commander.args.length !== 1) {
    showHelpAndExit();
}

(async () => {
    try {
        // Attempt to open file
        const data = await fs.readFile(commander.args[0]);

        const restoreJobs = JSON.parse(data);
        let errors = false;
        let jobAdded = 0;
        let jobUpdated = 0;
        async.eachSeries(restoreJobs, async function (jobToRestore) {
            try {
                const job = await Job.findById(new ObjectId(jobToRestore._id));
                if (!job) {
                    // Remove the id so we generate a new one
                    delete jobToRestore._id;
                    await jobs.add(jobToRestore);
                    jobAdded++;
                }
                else {
                    await jobs.update(jobToRestore._id, jobToRestore);
                    jobUpdated++;
                }
            }
            catch (err) {
                errors = true;
                console.error(`Problem adding job: ${JSON.stringify(jobToRestore)}`, err);
                // Don't rethrow so we continue to try to load jobs
            }
        }, function (err) {
            if (errors) {
                console.error('Jobs restored with errors');
                process.exit(1);
            }
            else {
                console.info('Jobs added: ' + jobAdded + ', updated: ' + jobUpdated);
                process.exit(0);
            }
        });
    }
    catch (err) {
        console.error('Problems restoring jobs', err);
        process.exit(1);
    }
})();

