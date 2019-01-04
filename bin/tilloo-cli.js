#!/usr/bin/env node

const commander = require('commander');

commander
    .version('0.0.2')
    .command('addjob <schedule> <imageuri> [options]', 'Add a new job')
    .command('backup', 'Backup all jobs')
    .command('deletejob <jobid>', 'Delete a job')
    .command('expireruns <days>', 'Expire runs created <days> ago')
    .command('jobdetail <jobId>', 'Show detail for a job')
    .command('killrun <runId>', 'Kill a running job')
    .command('listjobs', 'List jobs')
    .command('listruns <jobId>', 'List runs for job')
    .command('restore <file>', 'Restore a json file contained backed up jobs')
    .command('rundetail <runId>', 'Show detail for a run')
    .command('runjob <jobId>', 'Run a job immediately')
    .command('runoutput <runId>', 'Show output for a run')
    .command('updatejob <jobId> [options]', 'Update a job')
    .parse(process.argv);