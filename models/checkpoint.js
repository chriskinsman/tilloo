const mongoose = require('../lib/mongooseinit');

const Checkpoint = new mongoose.Schema({
    stream: { type: String, required: true, index: true, unique: true },
    resourceVersion: { type: Number, required: true }
});

Checkpoint.statics.initialize = async function initialize(stream) {
    const checkpoint = new Model({ stream: stream, resourceVersion: 0 });
    await checkpoint.save();
};

Checkpoint.statics.findByStream = async function findByStream(stream) {
    try {
        return await Model.findOne({ stream: stream }).exec();
    }
    catch (err) {
        console.error('Error finding stream', err);

        return null;
    }
};

Checkpoint.statics.findAndUpdateByStream = async function findAndUpdateByStream(stream, resourceVersion) {
    try {
        await Model.findOneAndUpdate({ stream: stream }, { '$set': { resourceVersion: resourceVersion } }).exec();
    }
    catch (err) {
        console.error(`Error finding and updating stream: ${stream} with resourceVersion: ${resourceVersion}`, err);
    }
};

const Model = mongoose.model('checkpoint', Checkpoint);
module.exports = Model;