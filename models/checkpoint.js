const mongoose = require('../lib/mongooseinit');

const Checkpoint = new mongoose.Schema({
    stream: { type: String, required: true, index: true, unique: true },
    resourceVersion: { type: Number, required: true }
});

Checkpoint.statics.initialize = function initialize(stream, callback) {
    const checkpoint = new Model({ stream: stream, resourceVersion: 0 });
    checkpoint.save(function (err) {
        if (err) {
            console.error('Checkpoing save error', err);
        }
        callback(err, checkpoint);
    });
};

Checkpoint.statics.findByStream = function findByStream(stream, callback) {
    Model.findOne({ stream: stream }, callback);
};

const Model = mongoose.model('checkpoint', Checkpoint);
module.exports = Model;