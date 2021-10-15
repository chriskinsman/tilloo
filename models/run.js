const constants = require('../lib/constants');

const moment = require('moment');
const mongoose = require('../lib/mongooseinit');

const Run = new mongoose.Schema({
    jobId: { type: mongoose.Schema.ObjectId, required: true, index: true },
    name: { type: String },
    path: { type: String, required: true },
    queueName: { type: String },
    timeout: { type: Number },
    status: { type: String, enum: [constants.JOBSTATUS.BUSY, constants.JOBSTATUS.IDLE, constants.JOBSTATUS.FAIL, constants.JOBSTATUS.SUCCESS], default: constants.JOBSTATUS.IDLE },
    result: { type: Number },
    createdAt: { type: Date, default: function () { return new Date(); }, index: true }, // eslint-disable-line brace-style
    updatedAt: { type: Date, default: function () { return new Date(); } }, // eslint-disable-line brace-style
    startedAt: { type: Date },
    completedAt: { type: Date },
    pod: { type: String },
    worker: { type: String }
});

Run.pre('save', function (done) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();

    return done();
});

Run.statics.findRunsForJob = async function findRunsForJob(jobId, sort) {
    try {
        return await Model.find({ jobId: new mongoose.Types.ObjectId(jobId) }, null, { sort: sort }).exec();
    }
    catch (err) {
        console.error('Error finding runs for job', err);
        throw err;
    }
};

Run.statics.findRunsForJobPaginated = async function findRunsForJobPaginated(jobId, page, pageSize, sort) {
    try {
        return await Model.find({ jobId: new mongoose.Types.ObjectId(jobId) }, null, { sort: sort })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .exec();
    }
    catch (err) {
        console.error('Error finding runs for job paginated', err);
        throw err;
    }
};


Run.statics.countRunsForJob = async function countRunsForJob(jobId) {
    try {
        return await Model.countDocuments({ jobId: new mongoose.Types.ObjectId(jobId) }).exec();
    }
    catch (err) {
        console.error('Error counting runs for job', err);
        throw err;
    }

};

Run.statics.findByRunId = async function findByRunId(runId) {
    try {
        return await Model.findById(new mongoose.Types.ObjectId(runId)).exec();
    }
    catch (err) {
        console.error('Error finding run by id', err);
        throw err;
    }
};

Run.statics.findRunsOlderThan = async function findRunsOlderThan(days) {
    try {
        return await Model.find({ createdAt: { $lte: moment().subtract(days, 'days').toDate() } }, '_id', { sort: { createdAt: 1 } }).exec();
    }
    catch (err) {
        console.error('Error finding runs older than', err);
        throw err;
    }

};

const Model = mongoose.model('run', Run);
module.exports = Model;