#! /usr/bin/env node
'use strict';

const commander = require('commander');
const Table = require('easy-table');
const dayjs = require('dayjs');
const localizedFormat = require('dayjs/plugin/localizedFormat');

dayjs.extend(localizedFormat);

const Run = require('../models/run');

commander.version('0.0.1')
    .usage('<jobId>', 'Id of job')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.help();
    process.exit(1);
}

(async () => {
    try {
        const table = new Table();
        const runs = await Run.findRunsForJob(commander.args[0], { startedAt: 1 });
        runs.forEach(function (run) {
            table.cell('Id', run._id);
            table.cell('Worker', run.worker);
            table.cell('Pod', run.pod);
            table.cell('Result', run.result);
            table.cell('Started', dayjs(run.startedAt).format('l LTS'));
            table.cell('Completed', dayjs(run.completedAt).format('l LTS'));
            table.cell('Status', run.status);
            table.newRow();
        });

        console.log(table.toString());
        process.exit(0);
    }
    catch (err) {
        console.error('Error listing runs for job', err);
        process.exit(1);
    }
})();


