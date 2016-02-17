'use strict';

var Job = require('../../models/job');
var Run = require('../../models/run');
var Log = require('../../models/log');

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

JobRoutes.getRuns = function getJobs(req, res) {
    var jobId = req.params.jobId;

    Run.findDetailsForJob(jobId, function(err, runs) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(runs);
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


module.exports = JobRoutes;