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

Run.statics.findRunsForJob = function findRunsForJob(jobId, sort, callback) {
    Model.find({ jobId: new mongoose.Types.ObjectId(jobId) }, null, { sort: sort }, callback);
};

Run.statics.findRunsForJobPaginated = function findRunsForJobPaginated(jobId, page, pageSize, sort, callback) {
    Model.find({ jobId: new mongoose.Types.ObjectId(jobId) }, null, { sort: sort })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(callback);
};


Run.statics.countRunsForJob = function countRunsForJob(jobId, callback) {
    Model.count({ jobId: new mongoose.Types.ObjectId(jobId) }, callback);
};

Run.statics.findByRunId = function findByRunId(runId, callback) {
    Model.findById(new mongoose.Types.ObjectId(runId), callback);
};

Run.statics.findRunsOlderThan = function findRunsOlderThan(days, callback) {
    Model.find({ createdAt: { $lte: moment().subtract(days, 'days').toDate() } }, '_id', { sort: { createdAt: 1 } }, callback);
};

const Model = mongoose.model('run', Run);
module.exports = Model;