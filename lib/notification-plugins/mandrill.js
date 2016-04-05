var Job = require('../../models/job');
var request = require('request');
var config = require('../config.js');
var constants = require('../../lib/constants');

exports.notify = function notify( message, lastErrorTime ) {

    var jobId = message.jobId;
    var runId = message.runId;

    var statusDescription = '';

    if ( message.status === constants.JOBSTATUS.FAIL ){
        statusDescription = 'Job failed';
    }

    if ( message.status === constants.JOBSTATUS.SUCCESS ){
        statusDescription = 'Job recovered from last fail';
    }

    Job.findByJobId( jobId,function( error,job ){

        var html = '<b>'+statusDescription+'.</b> <a href="http://'+config.web.host+':'+config.web.port+'/run/'+runId+'">Click here to view job.</a>';

        if(!error) {
            html = '<b>' + statusDescription + '.</b> View job: <a href="http://' + config.web.host + ':' + config.web.port + '/run/' + runId + '">' + job.name + '.</a>';
        }

        var body = {
            'key': config.notification.plugins.mandrill.key,
            'message': {
                'from_email': config.notification.plugins.mandrill.from_email,
                'to': [
                    {
                        'email': config.notification.plugins.mandrill.to_email,
                        'name': config.notification.plugins.mandrill.from_name,
                        'type':'to'
                    }
                ],
                'autotext': 'true',
                'subject': statusDescription,
                'html': html
            }
        };

        request.post( {url : "https://mandrillapp.com/api/1.0/messages/send.json", body: body, json: true }, function( error, response, body ) {
            if ( error ){
                console.log("Mandrill error: " + error);
            }
        });

    });

};