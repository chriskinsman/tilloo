'use strict';

var Job = require('../../models/job');
var Run = require('../../models/run');

var JobRoutes = {};

JobRoutes.list = function list(req, res) {
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

JobRoutes.runDetailList = function list(req, res) {
    var jobId = req.query.jobId;

    Run.findDetailsForJob(jobId, function(err, runs) {
        if(err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(runs);
        }
    });
};


module.exports = JobRoutes;