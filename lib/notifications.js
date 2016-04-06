'use strict';

var moment = require('moment');
var config = require('./config');
var constants = require('./constants');

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

    function broadcastNotification(message,lastErrorTime){
        notifiers.forEach(function(notifier){
            notifier.notify( message,lastErrorTime );
        });
    }

    if(config.hasOwnProperty('notification')){

        var jobId = message.jobId;

        if ( jobsInError[jobId] ){

            var statusTime = moment(jobsInError[jobId]);

            if ( moment().diff(statusTime, 'seconds') > config.notification.threshold ) {
                if ( message.status === constants.JOBSTATUS.FAIL ) {
                    // update to reset threshold
                    jobsInError[jobId] = moment().toDate();
                    broadcastNotification(message, jobsInError[jobId]);

                }
                if ( message.status === constants.JOBSTATUS.SUCCESS ) {
                    delete jobsInError[jobId];
                    broadcastNotification(message,jobsInError[jobId]);
               }
            }
        } else {

            if ( message.status === constants.JOBSTATUS.FAIL ) {
                jobsInError[jobId] =  moment().toDate();
                broadcastNotification( message, jobsInError[jobId] );
            }


        }
    }
};
