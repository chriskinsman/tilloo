'use strict';

var Job = require('../models/job');
var moment = require('moment');
var request = require('request');
var config = require('./config.js')

var jobsInError = {};

exports.sendEmail = function( message, callback ){

    function sendMail( jobId, txt ){

        var html = '<b>'+txt+'</b> <a href="http://'+config.scheduler.host+':'+config.web.port+'/job/'+jobId+'">Click here to view job.</a>';

        var body = {
            'key': config.notification.mandrill.key,
            'message': {
                'from_email': config.notification.mandrill.from_email,
                'to': config.notification.mandrill.to,
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
    };

    var jobId = message.jobId;

    if ( jobsInError[jobId] && jobsInError[jobId].length && jobsInError[jobId].indexOf(',' === -1 ) ){

        var job = jobsInError[jobId];
        var status = job.split(',')[0];
        var time = job.split(',')[1];
        var statusTime = moment.unix(time);
        var now = moment();

        if ( now.diff(statusTime, 'seconds') > config.notification.threshold ) {
            if ( message.status === 'fail' ) {
                sendMail(jobId,'Job failed.');
            }
            if ( status === 'fail' && message.status === 'success' ) {
                sendMail(jobId,'Job recovered from last fail.');
            }
            jobsInError[jobId] = message.status+ ',' + now.unix();
        }
    } else { 

        if ( message.status === 'fail' ) {
            sendMail(jobId,'Job failed.');
        }

        jobsInError[jobId] = message.status+ ',' + moment().unix();
    }
};
