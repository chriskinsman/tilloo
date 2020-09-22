#! /usr/bin/env node
'use strict';

const Job = require('../models/job');

(async () => {
    try {
        const jobs = await Job.find({ deleted: false }, null, { sort: { name: 1 } });
        console.log(JSON.stringify(jobs, null, 2));
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
})();

