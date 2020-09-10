'use strict';

const ObjectId = require('mongoose').Types.ObjectId;
const config = require('./config');
const constants = require('./constants');
const debug = require('debug')('tilloo:jobs');
const rabbit = require('./rabbitFactory');

const Job = require('../models/job');

console.info(`Jobs connecting to ${config.rabbitmq.host}:${config.rabbitmq.port}`);

const Jobs = {};

Jobs.add = function add(jobDef, callback) {
    const job = new Job(jobDef);

    job.save(function (err, dbJob) {
        if (err) {
            debug('error adding job', err);
            callback(err);
        }
        else {
            debug('job added jobId: %s', dbJob._id);
            debug('sending jobid: %s, action: %s', dbJob._id, constants.SCHEDULERACTION.NEW);
            const message = { jobId: dbJob._id, action: constants.SCHEDULERACTION.NEW };
            rabbit.publish(constants.QUEUES.SCHEDULER, message).then(() => {
                callback(dbJob);
            }).catch((err) => {
                console.error(err);
                callback(err);
            });
        }
    });
};

Jobs.remove = function remove(jobId, callback) {
    Job.findByIdAndUpdate(new ObjectId(jobId), { deleted: true }, function (err) {
        if (err) {
            debug('error removing job', err);
            callback(err);
        }
        else {
            debug('job removed jobId: %s', jobId);
            debug('sending jobid: %s, action: %s', jobId, constants.SCHEDULERACTION.DELETED);
            const message = { jobId: jobId, action: constants.SCHEDULERACTION.DELETED };
            rabbit.publish(constants.QUEUES.SCHEDULER, message).then(() => {
                callback();
            }).catch((err) => {
                console.error(err);
                callback(err);
            });
        }
    });
};

Jobs.update = function update(jobId, jobDef, callback) {
    Job.findById(new ObjectId(jobId), function (err, dbJob) {
        if (err) {
            callback(err);
        }
        else if (!dbJob) {
            callback('Job not found');
        }
        else {
            let action = constants.SCHEDULERACTION.UPDATED;

            // Copy over attributes
            Object.assign(dbJob, jobDef);

            if (!dbJob.enabled) {
                action = constants.SCHEDULERACTION.DELETED;
            }

            dbJob.save(function (err, dbJob) {
                if (err) {
                    callback(err);
                }
                else {
                    debug('job updated jobId: %s', jobId);
                    debug('sending jobid: %s, action: %s', jobId, action);
                    const message = { jobId: jobId, action: action };
                    rabbit.publish(constants.QUEUES.SCHEDULER, message).then(() => {
                        callback();
                    }).catch((err) => {
                        console.error(err);
                        callback(err);
                    });
                }
            });
        }
    });

};

Jobs.triggerRun = function triggerRun(jobId, callback) {
    Job.findByJobId(jobId, function (err, job) {
        if (err) {
            debug('error finding jobId: ' + jobId);
            callback(err);
        }
        else {
            debug('job triggered jobId: %s', jobId);
            job.triggerRun(callback);
        }
    });
};

module.exports = Jobs;