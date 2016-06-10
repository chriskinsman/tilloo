'use strict';

var moment = require('moment');
var config = require('./config');
var constants = require('./constants');
var Job = require('../models/job');

var jobsInError = {};
var notifiers = [];

if ( config.hasOwnProperty('notification') && config.notification.hasOwnProperty('plugins') ){
    Object.keys( config.notification.plugins ).forEach( function( key ){
        try {
            var notifier = require('./notification-plugins/' + key);
            if (notifier) {
                notifiers.push(notifier);
            }
        } catch ( e ){
            console.log('Unable to load plugin: '+key);
        }
    });
}

exports.notify = function notify( message ){

    function broadcastNotification(message, lastErrorTime, failureCount){
        notifiers.forEach(function(notifier){
            notifier.notify( message, lastErrorTime, failureCount);
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

                if (message.status === constants.JOBSTATUS.SUCCESS && jobsInError[jobId].alertSent) {
                    broadcastNotification(message, jobsInError[jobId].lastErrorTime, jobsInError[jobId].errorCount);
                    delete jobsInError[jobId];
                }
                else if (message.status === constants.JOBSTATUS.FAIL && ++jobsInError[jobId].errorCount >= failuresBeforeAlert && moment().diff(statusTime, 'seconds') > config.notification.threshold ) {
                    // update to reset threshold
                    jobsInError[jobId].lastErrorTime = moment().toDate();
                    jobsInError[jobId].alertSent = true;
                    broadcastNotification(message, jobsInError[jobId].lastErrorTime, jobsInError[jobId].errorCount);
                }
            } else {
                if (message.status === constants.JOBSTATUS.FAIL) {
                    jobsInError[jobId] = {lastErrorTime: moment().toDate(), errorCount: 1, alertSent: false};
                    if(failuresBeforeAlert===1) {
                        broadcastNotification(message, jobsInError[jobId].lastErrorTime, jobsInError[jobId].errorCount);
                        jobsInError[jobId].alertSent = true;
                    }
                }
            }
        });
    }
};
