'use strict';

const mongoose = require('../lib/mongooseinit');
const ObjectId = mongoose.Types.ObjectId;
const config = require('./config');
const constants = require('./constants');
const debug = require('debug')('tilloo:jobs');
const rabbit = require('./rabbitfactory');

const Job = require('../models/job');

console.info(`Jobs connecting to ${config.rabbitmq.host}:${config.rabbitmq.port}`);

const Jobs = {};

Jobs.add = async function add(jobDef) {
    const job = new Job(jobDef);

    try {
        const dbJob = await job.save();
        debug('job added jobId: %s', dbJob._id);
        debug('sending jobid: %s, action: %s', dbJob._id, constants.SCHEDULERACTION.NEW);
        const message = { jobId: dbJob._id, action: constants.SCHEDULERACTION.NEW };
        await rabbit.publish(constants.QUEUES.SCHEDULER, message);

        return dbJob;
    }
    catch (err) {
        debug('error adding job', err);
        throw new Error('Error adding job');
    }
};

Jobs.remove = async function remove(jobId) {
    try {
        await Job.findByIdAndUpdate(new ObjectId(jobId));
        debug('job removed jobId: %s', jobId);
        debug('sending jobid: %s, action: %s', jobId, constants.SCHEDULERACTION.DELETED);
        const message = { jobId: jobId, action: constants.SCHEDULERACTION.DELETED };
        await rabbit.publish(constants.QUEUES.SCHEDULER, message);
    }
    catch (err) {
        debug('error removing job', err);
        throw new Error('Error removing job');
    }
};

Jobs.update = async function update(jobId, jobDef) {
    try {
        const dbJob = await Job.findById(new ObjectId(jobId));
        if (!dbJob) {
            throw new Error('Job not found');
        }
        else {
            let action = constants.SCHEDULERACTION.UPDATED;

            // Copy over attributes
            Object.assign(dbJob, jobDef);

            if (!dbJob.enabled) {
                action = constants.SCHEDULERACTION.DELETED;
            }

            await dbJob.save();
            debug('job updated jobId: %s', jobId);
            debug('sending jobid: %s, action: %s', jobId, action);
            const message = { jobId: jobId, action: action };
            await rabbit.publish(constants.QUEUES.SCHEDULER, message);
        }
    }
    catch (err) {
        debug('error updating job', err);
        throw new Error('Error updating job');
    }
};

Jobs.triggerRun = async function triggerRun(jobId, callback) {
    try {
        const job = await Job.findByJobId(jobId);
        debug('job triggered jobId: %s', jobId);
        await job.triggerRun(callback);
    }
    catch (err) {
        debug('error finding jobId: ' + jobId);
        throw new Error('Error triggering job');
    }
};

module.exports = Jobs;