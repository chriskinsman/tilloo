#! /usr/bin/env node
'use strict';

const Job = require('../models/job');

Job.find({ deleted: false }, null, { sort: { name: 1 } }, function (err, jobs) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    else {
        console.log(JSON.stringify(jobs, null, 2));
        process.exit(0);
    }
});