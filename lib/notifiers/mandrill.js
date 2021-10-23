const axios = require('axios').default;
const debug = require('debug')('tilloo:notifier:mandrill');

function Mandrill(pluginConfig, generalConfig) {
    this.pluginConfig = pluginConfig;
    this.generalConfig = generalConfig;
}

Mandrill.prototype.notify = async function notify(message, lastErrorTime, failureCount, job) {
    if (!message.manualStop) {
        const jobId = message.jobId;
        const runId = message.runId;
        const toEmail = job?.alternateFailureEmail ?? this.pluginConfig.to_email;

        let html;
        if (job && job.name) {
            html = `<b>${message.statusDescription}.</b> View job: <a href="http://${this.pluginConfig.web_host}/run/${runId}">${job.name}.</a>`;
        }
        else {
            html = `<b>${message.statusDescription}.</b> <a href="http://${this.pluginConfig.web_host}/run/${runId}">Click here to view job.</a>`;
        }

        const body = {
            'key': this.pluginConfig.key,
            'message': {
                'from_email': this.pluginConfig.from_email,
                'to': [
                    {
                        'email': toEmail,
                        'name': this.pluginConfig.from_name,
                        'type': 'to'
                    }
                ],
                'autotext': 'true',
                'subject': message.statusDescription,
                'html': html
            }
        };

        try {
            await axios.post('https://mandrillapp.com/api/1.0/messages/send.json', body);
            debug(`Sent message to: ${toEmail}, jobId: ${jobId}, statusDescription: ${message.statusDescription}`);
        }
        catch (err) {
            debug('Error sending message err: %O', err);
            console.error('Mandrill error: ', err);
        }
    }
};

module.exports = Mandrill;