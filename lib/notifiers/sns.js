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

        if (job && job.name) {
            message.statusDescription = job.name + message.statusDescription;
        }
        else {
            message.statusDescription = 'Unknown Job ' + message.statusDescription;
        }

        const html = message.statusDescription + '. \n\nhttp://' + this.pluginConfig.web_host + '/run/' + runId;

        const params = {
            TopicArn: this.pluginConfig.topicArn,
            Message: html,
            Subject: message.statusDescription
        };

        sns.publish(params, function (err, data) {
            if (err) {
                console.error('SNS send error: ', err);
                debug('Error sending message err: %O', err);
            }
            else {
                debug('Sent message jobId: %s, statusDescription: %s, messageId: %s', jobId, message.statusDescription, data.MessageId);
            }
        });
    }
};

module.exports = SNS;