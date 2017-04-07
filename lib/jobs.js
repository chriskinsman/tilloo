'use strict';

var ObjectId = require('mongoose').Types.ObjectId;
var Disqueue = require('disqueue-node');
var config = require('./config');
var constants = require('./constants');
var debug = require('debug')('tilloo:jobs');

var Job = require('../models/job');

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
            debug('sending jobid: %s, action: %s', dbJob._id, constants.SCHEDULERACTION.NEW);
            var message = {jobId: dbJob._id,action: constants.SCHEDULERACTION.NEW};
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
            debug('sending jobid: %s, action: %s', jobId, constants.SCHEDULERACTION.DELETED);
            var message = {jobId: jobId,action: constants.SCHEDULERACTION.DELETED};
            disq.addJob({queue: constants.QUEUES.SCHEDULER, job: JSON.stringify(message), timeout: 0}, callback);
        }
    });
};

Jobs.update = function update(jobId, jobDef, callback) {
    Job.findById(new ObjectId(jobId), function(err, dbJob) {
        if(err) {
            callback(err);
        }
        else if(!dbJob){
            callback('Job not found');
        }
        else {
            var action = constants.SCHEDULERACTION.UPDATED;

            // Copy over attributes
            Object.assign(dbJob, jobDef);

            if(!dbJob.enabled) {
                action = constants.SCHEDULERACTION.DELETED;
            }

            dbJob.save(function(err, dbJob) {
                if(err) {
                    callback(err);
                }
                else {
                    debug('job updated jobId: %s', jobId);
                    debug('sending jobid: %s, action: %s', jobId, action);
                    var message = {jobId: jobId,action: action};
                    disq.addJob({queue: constants.QUEUES.SCHEDULER, job: JSON.stringify(message), timeout: 0}, callback);
                }
            });
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