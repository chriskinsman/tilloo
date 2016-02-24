'use strict';

var ObjectId = require('mongoose').Types.ObjectId;
var Disqueue = require('disqueue-node');
var config = require('./config');
var constants = require('./constants');
var debug = require('debug')('tilloo:jobs');


var Job = require('../models/job');
var debug = require('debug')('tilloo:jobs');

var disq = new Disqueue(config.disque);

var Jobs = {};

Jobs.add = function add(jobDef, callback) {
    var job = new Job(jobDef);

    job.save(function(err, dbJob) {
        if(err) {
            debug('error adding job', err);
            callback(err);
        }
        else {
            debug('job added jobId: %s', dbJob._id);
            var message = {jobId: dbJob._id,action: 'new'};
            disq.addJob({queue: constants.QUEUES.SCHEDULER, job: JSON.stringify(message), timeout: 0}, callback);
        }
    });
};

Jobs.remove = function remove(jobId, callback) {
    Job.findByIdAndUpdate(new ObjectId(jobId), {deleted: true}, function(err) {
        if(err) {
            debug('error removing job', err);
            callback(err);
        }
        else {
            debug('job removed jobId: %s', jobId);
            var message = {jobId: jobId,action: 'deleted'};
            disq.addJob({queue: constants.QUEUES.SCHEDULER, job: JSON.stringify(message), timeout: 0}, callback);
        }
    });
};

Jobs.triggerRun = function triggerRun(jobId, callback) {
    Job.findByJobId(jobId, function(err, job) {
        if(err) {
            debug('error finding jobId: ' + jobId);
            return callback(err);
        }
        else {
            debug('job triggered jobId: %s', jobId);
            job.triggerRun(callback);
        }
    });
};





module.exports = Jobs;