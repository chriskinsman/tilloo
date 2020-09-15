const mongoose = require('../lib/mongooseinit');
const ObjectId = mongoose.Types.ObjectId;
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

Job.pre('save', function save(done) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();

    return done();
});

Job.methods.newRun = function newRun() {
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

Job.methods.triggerRun = async function triggerRun() {
    const self = this;
    const run = self.newRun();
    try {
        await run.save();
        debug('sending start message for %s :: %s.', self.name, self._id);

        const k8sJob = new K8sJob(self._id, run._id, self.name, self.imageUri, self.path, self.args, self.nodeSelector, self.timeout);

        k8sJob.start();

        self.lastRanAt = new Date();
        await self.save();
    }
    catch (err) {
        debug('unable to save run for %s.', self.name);
        console.error(err);
        throw err;
    }
};

Job.methods.startCron = function startCron() {
    const self = this;

    this.__cron = new CronJob(this.schedule, async function () {
        debug('Cron trigger', self);
        if (self.mutex) {
            try {
                const run = await Run.findOne({ jobId: new ObjectId(self._id) }, null, { sort: { createdAt: -1 } }).exec();
                if (run && (run.status === constants.JOBSTATUS.BUSY || run.status === constants.JOBSTATUS.IDLE)) {
                    debug('Mutex not scheduling jobId: %s, runId: %s already running', self._id, run._id);
                }
                else {
                    await self.triggerRun();
                }
            }
            catch (err) {
                console.error(err);
                debug('Unable to check for running job not scheduling jobId: %s', self._id);
            }
        }
        else {
            await self.triggerRun();
        }
    });

    debug('starting cron %s for %s.', this.schedule, this.name);
    this.__cron.start();
};

Job.methods.stopCron = function stopCron() {
    if (this.__cron) {
        debug('stopping cron %s for %s.', this.schedule, this.name);
        this.__cron.stop();
        delete this.__cron;
    }
};

Job.statics.loadAllJobs = async function loadAllJobs() {
    debug('loading all jobs');
    try {
        return await Model.find({ deleted: false, enabled: true });
    }
    catch (err) {
        console.error('Error loading alljobs', err);
        throw err;
    }
};

Job.statics.findAllJobs = async function findAllJobs() {
    console.info('findAllJobs');
    try {
        return await Model.find({ deleted: false }, null, { sort: { name: 1 } });
    }
    catch (err) {
        console.error('Error finding all jobs', err);
        throw err;
    }

};

Job.statics.findByJobId = async function findByJobId(jobId) {
    try {
        return await Model.findById(new ObjectId(jobId));
    }
    catch (err) {
        console.error('Error finding job', err);
        throw err;
    }
};

const Model = mongoose.model('job', Job);
module.exports = Model;