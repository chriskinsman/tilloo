#! /usr/bin/env node
'use strict';

const commander = require('commander');
const runs = require('../lib/runs');

commander.version('0.0.1')
    .usage('<runId>')
    .option('-f, --force', 'Force kill a job.  Immediately sets status in mongodb to fail')
    .parse(process.argv);

if (commander.args.length !== 1) {
    commander.outputHelp();
    process.exit(1);
}

(async () => {
    try {
        await runs.killRun(commander.args[0], commander.force);
        console.info('Kill message sent');
        process.exit(0);
    }
    catch (err) {
        console.error('Unable to kill run', err);
        process.exit(1);
    }
})();

