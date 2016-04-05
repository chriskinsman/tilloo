'use strict';

var async = require('async');

var Job = require('../../models/job');
var Run = require('../../models/run');
var Log = require('../../models/log');

var runs = require('../../lib/runs');
var jobs = require('../../lib/jobs');

var JobRoutes = {};

JobRoutes.getJobs = function getJobs(req, res) {
    Job.findAllJobs(function(err, jobs) {
        if(err) {
            console.error(err);
            res.status(500).send(err);
        }
        else {
            res.status(200).send(jobs);
        }
    });
};

JobRoutes.getJob = function getJob(req, res) {
    var jobId = req.params.jobId;
    Job.findByJobId(jobId, function(err, job) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(job);
        }
    });
};

JobRoutes.getRun = function getRun(req, res) {
    var runId = req.params.runId;
    Run.findByRunId(runId, function(err, run) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(run);
        }
    });
};

JobRoutes.getJobByRunId = function getJobByRunId(req, res) {
    var runId = req.params.runId;
    Run.findByRunId(runId, function(err, run) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            Job.findByJobId(run.jobId, function (err, job) {
                if(err) {
                    res.status(500).send(err);
                }
                else {
                    res.status(200).send(job);
                }
            });
        }
    });

};

JobRoutes.getRuns = function getJobs(req, res) {
    var jobId = req.params.jobId;
    var page = parseInt(req.query.page);
    var pageSize = parseInt(req.query.pageSize);
    var sort = req.query.sort;

    async.parallel({
        runs: function(done) {
            sort = sort || {startedAt: -1};
            if(page && pageSize) {
                Run.findRunsForJobPaginated(jobId, page, pageSize, sort, done);
            }
            else {
                Run.findRunsForJob(jobId, sort, done);
            }
        },
        count: function(done) {
            Run.countRunsForJob(jobId, done);
        }
    }, function(err, result) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(result);
        }
    });
};

JobRoutes.outputForRun = function outputForRun(req, res) {
    var runId = req.params.runId;

    Log.findOutputForRun(runId, function(err, output) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(output);
        }
    });

};

JobRoutes.stopRun = function stopRun(req, res) {
    var runId = req.params.runId;

    runs.killRun(runId, false, function(err) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send('message sent');
        }
    });
};

JobRoutes.triggerRun = function triggerRun(req, res) {
    var jobId = req.params.jobId;

    jobs.triggerRun(jobId, function(err) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send('triggered');
        }
    });
};

JobRoutes.deleteJob = function deleteJob(req, res) {
    var jobId = req.params.jobId;

    jobs.remove(jobId, function(err) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send('triggered');
        }
    });
};

JobRoutes.createJob = function createJob(req, res) {
    var jobDef = req.body.jobDef;

    jobs.add(jobDef, function(err, job) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(job._id);
        }
    });
};

JobRoutes.updateJob = function updateJob(req, res) {
    var jobDef = req.body.jobDef;
    var jobId = req.params.jobId;

    jobs.update(jobId, jobDef, function(err) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send("updated");
        }
    });
};

module.exports = JobRoutes;