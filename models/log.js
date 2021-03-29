const mongoose = require('../lib/mongooseinit');

const Log = new mongoose.Schema({
    runId: { type: mongoose.Schema.ObjectId, required: true, index: true },
    output: { type: String, required: true },
    createdAt: { type: Date, default: function () { return new Date(); } } // eslint-disable-line brace-style
});

Log.pre('save', function (done) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }

    return done();
});

Log.statics.append = async function append(runId, output, createdAt) {
    try {
        return await new Model({ runId: runId, output: output, createdAt: createdAt }).save();
    }
    catch (err) {
        console.error('Error appending to log', err);
        throw err;
    }
};

Log.statics.upsert = async function upsert(runId, output, createdAt) {
    try {
        return await Model.findOneAndUpdate({ runId: new mongoose.Types.ObjectId(runId), createdAt: createdAt, output: output }, { runId: runId, output: output, createdAt: createdAt }, { upsert: true });
    }
    catch (err) {
        console.error('Error upserting to log', err);
        throw err;
    }
};

Log.statics.findOutputForRun = async function findOutputForRun(runId) {
    try {
        return await Model.find({ runId: new mongoose.Types.ObjectId(runId) }, 'output', { sort: { createdAt: 1 } }).exec();
    }
    catch (err) {
        console.error('Error finding output for run', err);
        throw err;
    }
};

Log.statics.deleteOutputForRun = async function deleteOutputForRun(runId) {
    try {
        return await Model.remove({ runId: new mongoose.Types.ObjectId(runId) });
    }
    catch (err) {
        console.error('Error deleting output for run', err);
        throw err;
    }
};

Log.statics.getMaxCreatedAtForRun = async function getMaxCreatedAtForRun(runId) {
    try {
        return await Model.findOne({ runId: new mongoose.Types.ObjectId(runId) }, null, { sort: { createdAt: -1 } }).exec();
    }
    catch (err) {
        console.error('Error getting maxCreatedAt for run', err);
        throw err;
    }
};

const Model = mongoose.model('log', Log);
module.exports = Model;