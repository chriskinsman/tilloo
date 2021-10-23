const AWS = require('aws-sdk');
const debug = require('debug')('tilloo:notifier:sns');

let sns;

function SNS(pluginConfig, generalConfig) {
    this.pluginConfig = pluginConfig;
    this.generalConfig = generalConfig;

    const awsConfig = {};
    if (this.pluginConfig.accessKeyId) {
        awsConfig.accessKeyId = this.pluginConfig.accessKeyId;
    }

    if (this.pluginConfig.secretAccessKey) {
        awsConfig.secretAccessKey = this.pluginConfig.secretAccessKey;
    }

    if (this.pluginConfig.region) {
        awsConfig.region = this.pluginConfig.region;
    }

    sns = new AWS.SNS(awsConfig);
}

SNS.prototype.notify = function notify(message, lastErrorTime, failureCount, job) {
    if (!message.manualStop) {
        const jobId = message.jobId;
        const runId = message.runId;

        let statusDescription = 'Unknown Status';

        if (message.status === 'fail') {
            statusDescription = ' failed';
        }
        else if (message.status === 'success') {
            statusDescription = ' recovered from last fail';
        }

        if (job && job.name) {
            statusDescription = job.name + statusDescription;
        }
        else {
            statusDescription = 'Unknown Job ' + statusDescription;
        }

        const html = statusDescription + '. \n\nhttp://' + this.pluginConfig.web_host + '/run/' + runId;

        const params = {
            TopicArn: this.pluginConfig.topicArn,
            Message: html,
            Subject: statusDescription
        };

        sns.publish(params, function (err, data) {
            if (err) {
                console.error('SNS send error: ', err);
                debug('Error sending message err: %O', err);
            }
            else {
                debug('Sent message jobId: %s, statusDescription: %s, messageId: %s', jobId, statusDescription, data.MessageId);
            }
        });
    }
};

module.exports = SNS;