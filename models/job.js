var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var CronJob = require('cron').CronJob;
var util = require('util');
var debug = require('debug')('tilloo:job');

var config = require('../lib/config');
var constants = require('../lib/constants');
var Run = require('./run');


var Disqueue = require('disqueue-node');
var disq = new Disqueue(config.disque);

var Job = new mongoose.Schema({
    name: { type: String, required: true},
    path: {type: String, required: true},
    args: [String],
    description: { type: String},
    schedule: { type: String, validate: function(v) {
        try {
            return (v + '').length === 0 || new CronJob(v);
        }
        catch(e) {
            return false;
        }
    }},
    queueName: {type: String, default: constants.QUEUES.DEFAULT_WORKER},
    enabled: {type: Boolean, default: 'true'},
    createdAt: {type: Date, default: function() { return new Date();}},
    updatedAt: {type: Date},
    lastRanAt: {type: Date},
    lastStatus: {type: String},
    mutex: {type: Boolean, default: true},
    timeout: {type: Number, default: 0},
    deleted: {type: Boolean, default: false}
});

Job.pre('save', function(done) {
    if(!this.createdAt)
    {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();
    return done();
});

Job.methods.newRun = function() {
    return new Run({
        jobId: this._id,
        name: this.name,
        path: this.path,
        args: this.args,
        queueName: this.queueName,
        timeout: this.timeout
    });
};

Job.methods.triggerRun = function(callback) {
    var self = this;
    var run = self.newRun();
    run.save(function(err, run) {
        if(err) {
            debug("unable to save run for %s.", self.name);
            console.error(err);
            if(callback) {
                return callback(err);
            }
        }
        else {
            debug("sending start message for %s :: %s.", self.name, self._id);

            // send message with run
            disq.addJob({ queue: self.queueName, job: JSON.stringify({jobId: self._id, runId: run._id, path: self.path, args: self.args, timeout: self.timeout}), timeout: 0}, function(err) {
                if(err) {
                    console.error(err);
                    if(callback) {
                        return callback(err);
                    }
                }
                else {
                    self.lastRanAt = new Date();
                    self.save(function(err) {
                        if(err) {
                            console.error(err);
                            if(callback) {
                                return callback(err);
                            }
                        }
                        else {
                            if(callback) {
                                return callback();
                            }
                        }
                    });
                }
            });
        }
    });
};

Job.methods.startCron = function() {
    var self = this;


    this.__cron = new CronJob(this.schedule, function() {
        if(self.mutex) {
            Run.findOne({jobId: new ObjectId(self._id)}, null, {sort: {createdAt: -1}}, function(err, run) {
                if(run && (run.status === constants.JOBSTATUS.BUSY || run.status === constants.JOBSTATUS.IDLE)) {
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

    debug("starting cron %s for %s.", this.schedule, this.name);
    this.__cron.start();
};

Job.methods.stopCron = function() {
    if(this.__cron) {
        debug("stopping cron %s for %s.", this.schedule, this.name);
        this.__cron.stop();
        delete this.__cron;
    }
};

Job.statics.loadAllJobs = function(callback) {
    debug("loading all jobs");
    model.find({deleted: false, enabled: true}, function(err, jobs) {
        return callback(err, jobs);
    });
};

Job.statics.findAllJobs = function findAllJobs(callback) {
    model.find({deleted: false}, null, {sort: {name: 1}}, callback);
};

Job.statics.findByJobId = function findByJobId(jobId, callback) {
    model.findById(new ObjectId(jobId), callback);
};

var model = mongoose.model('job', Job);
module.exports = model;