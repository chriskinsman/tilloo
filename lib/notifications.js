'use strict';

const moment = require('moment');
const config = require('./config');
const constants = require('./constants');
const Job = require('../models/job');
const debug = require('debug')('tilloo:notifications');

const jobsInError = {};
const notifiers = [];

if (config.notification && config.notification.plugins) {
    Object.keys(config.notification.plugins).forEach(function (key) {
        const pluginConfig = config.notification.plugins[key];
        try {
            debug(`Creating notififer: ${key}`);
            const Notifier = require(key); // eslint-disable-line global-require
            if (Notifier) {
                notifiers.push(new Notifier(pluginConfig, config));
            }
        }
        catch (e) {
            debug('Unable to load plugin err', e);
            console.log('Unable to load plugin: '+key, e);
        }
    });
}

exports.notify = function notify(message) {

    function broadcastNotification(message, lastErrorTime, failureCount, job) {
        debug(`Notifying for jobId: ${message.jobId}, lastErrorTime: ${lastErrorTime}, failureCount: ${failureCount}`);
        notifiers.forEach(function(notifier) {
            notifier.notify(message, lastErrorTime, failureCount, job);
        });
    }

    if(config.notification) {
        const jobId = message.jobId;
        let failuresBeforeAlert = 1;

        Job.findByJobId(jobId, function(err, job) {
            if (!err && job && job.failuresBeforeAlert) {
                failuresBeforeAlert = job.failuresBeforeAlert;
            }

            if (jobsInError[jobId]) {
                const statusTime = moment(jobsInError[jobId].lastErrorTime);
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
            }
            else if (message.status === constants.JOBSTATUS.FAIL) {
                jobsInError[jobId] = { lastErrorTime: moment().toDate(), errorCount: 1, alertSent: false };
                if(failuresBeforeAlert===1) {
                    broadcastNotification(message, jobsInError[jobId].lastErrorTime, jobsInError[jobId].errorCount, job);
                    jobsInError[jobId].alertSent = true;
                }
            }
        });
    }
};
