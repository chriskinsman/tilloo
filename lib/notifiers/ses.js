const AWS = require('aws-sdk');
const debug = require('debug')('tilloo:notifier:ses');

let ses;

function SES(pluginConfig, generalConfig) {
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

    ses = new AWS.SES(awsConfig);
}

SES.prototype.notify = async function notify(message, lastErrorTime, failureCount, job) {
    if (!message.manualStop) {
        const jobId = message.jobId;
        const runId = message.runId;
        const toEmail = job?.alternateFailureEmail && job?.alternateFailureEmail?.length > 0 ? job.alternateFailureEmail : this.pluginConfig.to_email;

        let html;
        if (job && job.name) {
            html = `<b>${message.statusDescription}.</b> View job: <a href="http://${this.pluginConfig.web_host}/run/${runId}">${job.name}.</a>`;
        }
        else {
            html = `<b>${message.statusDescription}.</b> <a href="http://${this.pluginConfig.web_host}/run/${runId}">Click here to view job.</a>`;
        }

        const params = {
            Destination: {
                ToAddresses: [toEmail],
            },
            Message: {
                Subject: {
                    Data: message.statusDescription,
                },
                Body: {
                    Html: {
                        Data: html,
                    },
                },
            },
            Source: this.pluginConfig.from_email,
        };

        try {
            debug(`Sending message body: ${params}`);
            const response = await ses.sendEmail(params).promise();
            debug(`AWS SES response messageId: ${response.MessageId}`);
            debug(`Sent message to: ${toEmail}, jobId: ${jobId}, statusDescription: ${message.statusDescription}`);
        } catch (err) {
            debug('Error sending message err: %O', err);
            console.error('SES error: ', err);
        }
    }
};

module.exports = SES;