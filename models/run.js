var mongoose = require('mongoose');

var Run = new mongoose.Schema({
    jobId: { type: mongoose.Schema.ObjectId, required: true, index: true},
    name: {type: String},
    path: {type: String, required: true},
    queueName: {type: String},
    timeout: {type: Number},
    status: {type:String, enum: ['busy', 'idle', 'fail','success'], default: 'idle'},
    result: {type:Number},
    createdAt: {type: Date, default: function() { return new Date()}},
    updatedAt: {type: Date, default: function() { return new Date()}},
    startedAt:{type: Date},
    completedAt:{type: Date},
    pid: {type:String},
    worker: {type:String}
});

Run.pre('save', function(done) {
    if(!this.createdAt)
    {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();
    return done();
});

Run.statics.findDetailsForJob = function findDetailsForJob(jobId, callback) {
    model.find({jobId: new mongoose.Types.ObjectId(jobId)}, null, {sort: {startedAt: -1}}, callback);
};

Run.statics.findByRunId = function findByRunId(runId, callback) {
    model.findById(new mongoose.Types.ObjectId(runId), callback);
};

var model = mongoose.model('run', Run);
module.exports = model;