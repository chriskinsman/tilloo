const mongoose = require('mongoose');

const Log = new mongoose.Schema({
    runId: { type: mongoose.Schema.ObjectId, required: true, index: true },
    output: { type: String, required: true },
    createdAt: { type: Date, default: function () { return new Date(); } } // eslint-disable-line brace-style
});

Log.pre('save', function(done) {
    if(!this.createdAt) {
        this.createdAt = new Date();
    }

    return done();
});

Log.statics.append = function append(runId, output, createdAt, callback) {
    new Model({ runId: runId, output: output, createdAt: createdAt }).save(function(err) {
        if(err) {
            console.error(err);
        }

        callback(err);
    });
};

Log.statics.findOutputForRun = function findOutputForRun(runId, callback) {
    Model.find({ runId: new mongoose.Types.ObjectId(runId) }, 'output', { sort: { createdAt: 1 } }, callback);
};

Log.statics.deleteOutputForRun = function deleteOutputForRun(runId, callback) {
    Model.remove({ runId: new mongoose.Types.ObjectId(runId) }, callback);
};

Log.statics.getMaxCreatedAtForRun = function getMaxCreatedAtForRun(runId, callback) {
    Model.findOne({ runId: new mongoose.Types.ObjectId(runId) }, null, { sort: { createdAt: -1 } }, callback);
};

const Model = mongoose.model('log', Log);
module.exports = Model;