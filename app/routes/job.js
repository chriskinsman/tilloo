'use strict';

const async = require('async');

const Job = require('../../models/job');
const Run = require('../../models/run');
const Log = require('../../models/log');

const runs = require('../../lib/runs');
const jobs = require('../../lib/jobs');

const JobRoutes = {};

JobRoutes.getJobs = async function getJobs(req, res) {
    try {
        const jobs = await Job.findAllJobs();
        res.status(200).send(jobs);
    }
    catch (err) {
        console.error('getJobs', err);
        res.status(500).send(err);
    }
    return;
};

JobRoutes.getJob = async function getJob(req, res) {
    try {
        const jobId = req.params.jobId;
        const job = await Job.findByJobId(jobId);
        res.status(200).send(job);
    }
    catch (err) {
        console.error('getJob', err);
        res.status(500).send(err);
    }
};

JobRoutes.getRun = async function getRun(req, res) {
    try {
        const runId = req.params.runId;
        const run = await Run.findByRunId(runId);
        res.status(200).send(run);
    }
    catch (err) {
        console.error('getRun', err);
        res.status(500).send(err);
    }
};

JobRoutes.getJobByRunId = async function getJobByRunId(req, res) {
    try {
        const runId = req.params.runId;
        const run = await Run.findByRunId(runId);
        const job = await Job.findByJobId(run.jobId);
        res.status(200).send(job);
    }
    catch (err) {
        console.error('getJobByRunId', err);
        res.status(500).send(err);
    }
};

JobRoutes.getRuns = async function getRuns(req, res) {
    try {
        const jobId = req.params.jobId;
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
                res.status(500).send(err);
            }
            else {
                res.status(200).send(result);
            }
        });
    }
    catch (err) {
        console.error('getRuns', err);
        res.status(500).send(err);
    }
};

JobRoutes.outputForRun = async function outputForRun(req, res) {
    try {
        const runId = req.params.runId;

        const output = await Log.findOutputForRun(runId);
        res.status(200).send(output);
    }
    catch (err) {
        console.error('outputForRun', err);
        res.status(500).send(err);
    }
};

JobRoutes.stopRun = async function stopRun(req, res) {
    try {
        const runId = req.params.runId;

        await runs.killRun(runId);
        res.status(200).send('message sent');
    }
    catch (err) {
        console.error('stopRun', err);
        res.status(500).send(err);
    }
};

JobRoutes.triggerRun = async function triggerRun(req, res) {
    try {
        const jobId = req.params.jobId;

        await jobs.triggerRun(jobId);
        res.status(200).send('triggered');
    }
    catch (err) {
        console.error('triggerRun', err);
        res.status(500).send(err);
    }

};

JobRoutes.deleteJob = async function deleteJob(req, res) {
    try {
        const jobId = req.params.jobId;

        await jobs.remove(jobId);
        res.status(200).send('deleted');
    }
    catch (err) {
        console.error('deleteJob', err);
        res.status(500).send(err);
    }
};

JobRoutes.createJob = async function createJob(req, res) {
    try {
        const jobDef = req.body.jobDef;

        const job = await jobs.add(jobDef);
        res.status(200).send(job._id);
    }
    catch (err) {
        console.error('createJob', err);
        res.status(500).send(err);
    }
};

JobRoutes.updateJob = async function updateJob(req, res) {
    try {
        const jobDef = req.body.jobDef;
        const jobId = req.params.jobId;

        await jobs.update(jobId, jobDef);
        res.status(200).send('updated');
    }
    catch (err) {
        console.error('updateJob', err);
        res.status(500).send(err);
    }
};

module.exports = JobRoutes;