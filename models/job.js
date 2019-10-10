const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const CronJob = require('cron').CronJob;
const debug = require('debug')('tilloo:job');

const constants = require('../lib/constants');
const Run = require('./run');
const K8sJob = require('../lib/k8s/job');

const Job = new mongoose.Schema({
    name: { type: String, required: true },
    path: { type: String },
    args: [String],
    description: { type: String },
    schedule: {
        type: String, validate: function (v) {
            try {
                return String(v).length === 0 || new CronJob(v);
            }
            catch (e) {
                return false;
            }
        }
    },
    //queueName: { type: String, default: constants.QUEUES.DEFAULT_WORKER },
    imageUri: { type: String, required: true },
    nodeSelector: { type: String },
    enabled: { type: Boolean, default: 'true' },
    createdAt: { type: Date, default: function () { return new Date(); } }, // eslint-disable-line brace-style
    updatedAt: { type: Date },
    lastRanAt: { type: Date },
    lastStatus: { type: String },
    mutex: { type: Boolean, default: true },
    timeout: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },
    failuresBeforeAlert: { type: Number, default: 1 }
});

Job.pre('save', function (done) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();

    return done();
});

Job.methods.newRun = function () {
    return new Run({
        jobId: this._id,
        name: this.name,
        path: this.path,
        args: this.args,
        //queueName: this.queueName,
        imageUri: this.imageUri,
        nodeSelector: this.nodeSelector,
        timeout: this.timeout
    });
};

Job.methods.triggerRun = function (callback) {
    const self = this;
    const run = self.newRun();
    run.save(function (err, run) {
        if (err) {
            debug('unable to save run for %s.', self.name);
            console.error(err);
            if (callback) {
                callback(err);
            }
        }
        else {
            debug('sending start message for %s :: %s.', self.name, self._id);

            const k8sJob = new K8sJob(self._id, run._id, self.name, self.imageUri, self.path, self.args, self.nodeSelector, self.timeout);

            k8sJob.start();

            self.lastRanAt = new Date();
            self.save(function (err) {
                if (err) {
                    console.error(err);
                    if (callback) {
                        callback(err);
                    }
                }
                else if (callback) {
                    callback();
                }
            });
        }
    });
};

Job.methods.startCron = function () {
    const self = this;

    this.__cron = new CronJob(this.schedule, function () {
        debug('Cron trigger', self);
        if (self.mutex) {
            Run.findOne({ jobId: new ObjectId(self._id) }, null, { sort: { createdAt: -1 } }, function (err, run) {
                if (err) {
                    console.error(err);
                    debug('Unable to check for running job not scheduling jobId: %s', self._id);
                }
                else if (run && (run.status === constants.JOBSTATUS.BUSY || run.status === constants.JOBSTATUS.IDLE)) {
                    debug('Mutex not scheduling jobId: %s, runId: %s already running', self._id, run._id);
                }
                else {
                    self.triggerRun();
                }
            });
        }
        else {
            self.triggerRun();
        }
    });

    debug('starting cron %s for %s.', this.schedule, this.name);
    this.__cron.start();
};

Job.methods.stopCron = function () {
    if (this.__cron) {
        debug('stopping cron %s for %s.', this.schedule, this.name);
        this.__cron.stop();
        delete this.__cron;
    }
};

Job.statics.loadAllJobs = function (callback) {
    debug('loading all jobs');
    Model.find({ deleted: false, enabled: true }, function (err, jobs) {
        return callback(err, jobs);
    });
};

Job.statics.findAllJobs = function findAllJobs(callback) {
    console.info('findAllJobs');
    Model.find({ deleted: false }, null, { sort: { name: 1 } }, callback);
};

Job.statics.findByJobId = function findByJobId(jobId, callback) {
    Model.findById(new ObjectId(jobId), callback);
};

const Model = mongoose.model('job', Job);
module.exports = Model;