#! /usr/bin/env node
'use strict';

const Table = require('easy-table');
const dayjs = require('dayjs');
const localizedFormat = require('dayjs/plugin/localizedFormat');

dayjs.extend(localizedFormat);

const Job = require('../models/job');

(async () => {
    try {
        const table = new Table();
        const jobs = await Job.find({ deleted: false }, null, { sort: { name: 1 } });
        jobs.forEach(function (job) {
            table.cell('Id', job._id);
            table.cell('Name', job.name);
            table.cell('Schedule', job.schedule);
            table.cell('Enabled', job.enabled);
            table.cell('Node Selector', job.nodeSelector);
            table.cell('Last Ran', job.lastRanAt ? dayjs(job.lastRanAt).format('l LTS') : '');
            table.cell('Last Status', job.lastStatus);
            table.newRow();
        });

        console.log(table.toString());
        process.exit(0);
    }
    catch (err) {
        console.error('Error listing jobs', err);
        process.exit(1);
    }
})();


