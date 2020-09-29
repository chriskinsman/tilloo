const mongoose = require('../lib/mongooseinit');

const Checkpoint = new mongoose.Schema({
    stream: { type: String, required: true, index: true, unique: true },
    resourceVersion: { type: Number, required: true }
});

const checkpointName = 'checkpoint';

Checkpoint.statics.initializeResourceVersion = async function initializeResourceVersion(stream) {
    const checkpoint = new Model({ stream: checkpointName, resourceVersion: 0 });
    await checkpoint.save();
};


Checkpoint.statics.getInitialResourceVersion = async function getInitialResourceVersion() {
    try {
        return await Model.findOne({ stream: checkpointName }).exec();
    }
    catch (err) {
        console.error('Error finding initialResourceVersion', err);

        return null;
    }
};

Checkpoint.statics.saveResourceVersion = async function saveResourceVersion(resourceVersion) {
    try {
        await Model.findOneAndUpdate({ stream: checkpointName }, { '$set': { resourceVersion: resourceVersion } }).exec();
    }
    catch (err) {
        console.error(`Error saveResourceVersion with resourceVersion: ${resourceVersion}`, err);
    }
};

const Model = mongoose.model('checkpoint', Checkpoint);
module.exports = Model;