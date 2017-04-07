'use strict';

var moment = require('moment');
var config = require('./config');
var constants = require('./constants');
var Job = require('../models/job');
var debug = require('debug')('tilloo:notifications');

var jobsInError = {};
var notifiers = [];

if ( config.hasOwnProperty('notification') && config.notification.hasOwnProperty('plugins') ){
    Object.keys(config.notification.plugins).forEach(function (key) {        
        var pluginConfig = config.notification.plugins[key];
        // Fix up to maintain backward compatibility post move to plugin model for notifications
        if (key === 'mandrill') {
            key = 'tilloo-plugin-mandrill';
        }
        try {
            debug(`Creating notififer: ${key}`);
            var Notifier = require(key);
            if (Notifier) {
                notifiers.push(new Notifier(pluginConfig, config));
            }
        } catch (e) {
            debug(`Unable to load plugin err: %O`, e);
            console.log('Unable to load plugin: '+key);
        }
    });
}

exports.notify = function notify( message ){

    function broadcastNotification(message, lastErrorTime, failureCount, job) {
        debug(`Notifying for jobId: ${message.jobId}, lastErrorTime: ${lastErrorTime}, failureCount: ${failureCount}`);
        notifiers.forEach(function(notifier){
            notifier.notify( message, lastErrorTime, failureCount, job);
        });
    }

    if(config.hasOwnProperty('notification')){

        var jobId = message.jobId;
        var failuresBeforeAlert = 1;

        Job.findByJobId(jobId, function(err, job) {
            if (!err && job && job.failuresBeforeAlert) {
                failuresBeforeAlert = job.failuresBeforeAlert;
            }

            if (jobsInError[jobId]) {
                var statusTime = moment(jobsInError[jobId].lastErrorTime);
                // Increment the error count to include this instance of the error

                if (message.status === constants.JOBSTATUS.SUCCESS) {
                    if(jobsInError[jobId].alertSent) {
                        broadcastNotification(message, jobsInError[jobId].lastErrorTime, jobsInError[jobId].errorCount, job);
                    }
                    delete jobsInError[jobId];
                }
                else if (message.status === constants.JOBSTATUS.FAIL && ++jobsInError[jobId].errorCount >= failuresBeforeAlert && (moment().diff(statusTime, 'seconds') > config.notification.threshold || !jobsInError[jobId].alertSent)) {
                    // update to reset threshold
                    jobsInError[jobId].lastErrorTime = moment().toDate();
                    jobsInError[jobId].alertSent = true;
                    broadcastNotification(message, jobsInError[jobId].lastErrorTime, jobsInError[jobId].errorCount, job);
                }
            } else {
                if (message.status === constants.JOBSTATUS.FAIL) {
                    jobsInError[jobId] = {lastErrorTime: moment().toDate(), errorCount: 1, alertSent: false};
                    if(failuresBeforeAlert===1) {
                        broadcastNotification(message, jobsInError[jobId].lastErrorTime, jobsInError[jobId].errorCount, job);
                        jobsInError[jobId].alertSent = true;
                    }
                }
            }
        });
    }
};
