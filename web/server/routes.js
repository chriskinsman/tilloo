'use strict';

const async = require('async');
const express = require('express');
const router = express.Router();

const Job = require('../../models/job');
const Run = require('../../models/run');
const Log = require('../../models/log');

const runs = require('../../lib/runs');
const jobs = require('../../lib/jobs');

router.get('/job', async function getJobs(req, res) {
    try {
        const jobs = await Job.findAllJobs();
        res.status(200).send(jobs);
    }
    catch (err) {
        console.error(`Error getting jobs`, err);
        res.status(500).send(err);
    }
    return;
});

router.get('/job/:jobId', async function getJob(req, res) {
    const jobId = req.params.jobId;

    try {
        const job = await Job.findByJobId(jobId);
        res.status(200).send(job);
    }
    catch (err) {
        console.error(`Error getting jobId: ${jobId}`, err);
        res.status(500).send(err);
    }
});

router.get('/run/:runId', async function getRun(req, res) {
    const runId = req.params.runId;

    try {
        const run = await Run.findByRunId(runId);
        res.status(200).send(run);
    }
    catch (err) {
        console.error(`Error getting runId: ${runId}`, err);
        res.status(500).send(err);
    }
});

router.get('/job/run/:runId', async function getJobByRunId(req, res) {
    const runId = req.params.runId;

    try {
        const run = await Run.findByRunId(runId);
        const job = await Job.findByJobId(run.jobId);
        res.status(200).send(job);
    }
    catch (err) {
        console.error(`Error getting job by runId: ${runId}`, err);
        res.status(500).send(err);
    }
});

router.get('/job/:jobId/runs', async function getRuns(req, res) {
    const jobId = req.params.jobId;

    try {
        const page = parseInt(req.query.page, 10);
        const pageSize = parseInt(req.query.pageSize, 10);
        let sort = req.query.sort;

        async.parallel({
            runs: async function runs() {
                sort = sort || { startedAt: -1 };
                if (page && pageSize) {
                    return await Run.findRunsForJobPaginated(jobId, page, pageSize, sort);
                }
                else {
                    return await Run.findRunsForJob(jobId, sort);
                }
            },
            count: async function count() {
                return await Run.countRunsForJob(jobId);
            }
        }, function (err, result) {
            if (err) {
                console.error(`Error getting runs for jobId: ${jobId}`, err);
                res.status(500).send(err);
            }
            else {
                res.status(200).send(result);
            }
        });
    }
    catch (err) {
        res.status(500).send(err);
    }
});

router.get('/run/:runId/output', async function outputForRun(req, res) {
    const runId = req.params.runId;

    try {
        const output = await Log.findOutputForRun(runId);
        res.status(200).send(output);
    }
    catch (err) {
        console.error(`Error getting output for runId: ${runId}`, err);
        res.status(500).send(err);
    }
});

router.post('/run/:runId/stop', async function stopRun(req, res) {
    const runId = req.params.runId;

    try {
        await runs.killRun(runId);
        res.status(200).send('message sent');
    }
    catch (err) {
        console.error(`Error stopping runId: ${runId}`, err);
        res.status(500).send(err);
    }
});

router.post('/job/:jobId/run', async function triggerRun(req, res) {
    const jobId = req.params.jobId;

    try {
        await jobs.triggerRun(jobId);
        res.status(200).send('triggered');
    }
    catch (err) {
        console.error(`Error running jobId: ${jobId}`, err);
        res.status(500).send(err);
    }

});

router.post('/job/:jobId/delete', async function deleteJob(req, res) {
    const jobId = req.params.jobId;

    try {
        await jobs.remove(jobId);
        res.status(200).send('deleted');
    }
    catch (err) {
        console.error(`Error deleting jobId: ${jobId}`, err);
        res.status(500).send(err);
    }
});

router.post('/job/create', async function createJob(req, res) {
    try {
        const jobDef = req.body.jobDef;

        const job = await jobs.add(jobDef);
        res.status(200).send(job._id);
    }
    catch (err) {
        console.error(`Error creating job`, err);
        res.status(500).send(err);
    }
});

router.post('/job/:jobId/update', async function updateJob(req, res) {
    const jobId = req.params.jobId;

    try {
        const jobDef = req.body.jobDef;

        await jobs.update(jobId, jobDef);
        res.status(200).send('updated');
    }
    catch (err) {
        console.error(`Error updating jobId: ${jobId}`, err);
        res.status(500).send(err);
    }
});

module.exports = router;