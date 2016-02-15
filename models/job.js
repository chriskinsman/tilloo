var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var CronJob = require('cron').CronJob;
var util = require('util');
var debuglog = util.debuglog('TILLOO');

var config = require('../lib/config')
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
    createdAt: {type: Date, default: function() { return new Date()}},
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

Job.methods.startCron = function() {
    var self = this;

    function triggerRun() {
        var run = self.newRun();
        run.save(function(err, run) {
            if(err) {
                debuglog("unable to save run for %s.", self.name);
                console.error(err);
            }
            else {
                debuglog("sending start message for %s.", self.name);
                // send message with run
                disq.addJob({ queue: self.queueName, job: JSON.stringify({runId: run._id, path: self.path, args: self.args, timeout: self.timeout}), timeout: 0}, function(err) {
                    if(err) {
                        console.error(err);
                    }
                    else {
                        self.lastRanAt = new Date();
                        self.save(function(err) {
                            if(err) {
                                console.error(err);
                            }
                        });
                    }
                });
            }
        });
    }

    this.__cron = new CronJob(this.schedule, function() {
        if(self.mutex) {
            Run.findOne({jobId: new ObjectId(self._id)}, null, {sort: {createdAt: -1}}, function(err, run) {
                if(run && (run.status === 'busy' || run.status === 'idle')) {
                    debuglog('Mutex not scheduling jobId: %s, runId: %s already running', self._id, run._id);
                }
                else {
                    triggerRun();
                }
            });
        }
        else {
            triggerRun();
        }
    });

    debuglog("starting cron %s for %s.", this.schedule, this.name);
    this.__cron.start();
};

Job.methods.stopCron = function() {
    if(this.__cron) {
        debuglog("stopping cron %s for %s.", this.schedule, this.name);
        this.__cron.stop();
        delete this.__cron;
    }
};

Job.statics.loadAllJobs = function(callback) {
    debuglog("loading all jobs");
    model.find({deleted: false, enabled: true}, function(err, jobs) {
        return callback(err, jobs);
    });
};

Job.statics.findAllJobs = function findAllJobs(callback) {
    model.find({deleted: false}, null, {sort: {name: 1}}, callback);
};

var model = mongoose.model('job', Job);
module.exports = model;