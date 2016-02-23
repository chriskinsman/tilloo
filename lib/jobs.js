'use strict';

var Job = require('../models/job');
var debug = require('debug')('tilloo:jobs');

var Jobs = {};

Jobs.triggerRun = function triggerRun(jobId, callback) {
    Job.findByJobId(jobId, function(err, job) {
        if(err) {
            debug('error finding jobId: ' + jobId);
            return callback(err);
        }
        else {
            job.triggerRun(callback);
        }
    });
};



module.exports = Jobs;