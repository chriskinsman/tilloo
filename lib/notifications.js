'use strict';

var Job = require('../models/job');
var moment = require('moment');
var request = require('request');
var config = require('./config.js');

var jobsInError = {};

exports.sendEmail = function( message, callback ){

    function sendMail( jobId, runId, txt ){

        Job.findByJobId(jobId,function(error,job){

            var html = '<b>'+txt+'</b> <a href="http://'+config.web.host+':'+config.web.port+'/run/'+runId+'">Click here to view job.</a>';

            if(!error) {
                html = '<b>' + txt + '</b> <a href="http://' + config.web.host + ':' + config.web.port + '/run/' + runId + '">View job: ' + job.name + '.</a>';
            }

            var body = {
                'key': config.notification.mandrill.key,
                'message': {
                    'from_email': config.notification.mandrill.from_email,
                    'to': [
                        {
                            'email': config.notification.mandrill.to_email,
                            'name': config.notification.mandrill.from_name,
                            'type':'to'
                        }
                    ],
                    'autotext': 'true',
                    'subject': txt,
                    'html': html
                }
            };

            request.post( {url : "https://mandrillapp.com/api/1.0/messages/send.json", body: body, json: true }, function( error, response, body ) {
                if ( error ){
                    console.log("Mandrill error: " + error);
                }
            });

        });

    }

    var jobId = message.jobId;
    var runId = message.runId;

    if ( jobsInError[jobId] ){

        var statusTime = moment(jobsInError[jobId]);

        if ( moment().diff(statusTime, 'seconds') > config.notification.threshold ) {
            if ( message.status === 'fail' ) {
                // update to reset threshold
                jobsInError[jobId] = moment().toDate();
                sendMail(jobId,runId,'Job failed.');
            }
            if ( message.status === 'success' ) {
                delete jobsInError[jobId];
                sendMail(jobId,runId,'Job recovered from last fail.');
           }
        }
    } else { 

        if ( message.status === 'fail' ) {
            jobsInError[jobId] =  moment().toDate();
            sendMail( jobId,runId,'Job failed.' );
        }


    }
};
