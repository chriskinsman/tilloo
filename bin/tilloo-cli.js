#!/usr/bin/env node

var commander = require('commander');

commander
    .version('0.0.1')
    .command('addjob <schedule> <path> [options]', 'Add a new job')
    .command('backup', 'Backup all jobs')
    .command('deletejob <jobid>', 'Delete a job')
    .command('expireruns <days>', 'Expire runs created <days> ago')
    .command('jobdetail <jobId>', 'Show detail for a job')
    .command('killrun <runId>', 'Kill a running job')
    .command('listjobs', 'List jobs')
    .command('listruns <jobId>', 'List runs for job')
    .command('restore <file>', 'Restore a json file contained backed up jobs')
    .command('rundetail <runId>', 'Show detail for a run')
    .command('runoutput <runId>', 'Show output for a run')
    .parse(process.argv);