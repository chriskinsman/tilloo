var axios = require('axios').default;
var debug = require('debug')('tilloo:notifier:mandrill');

function Mandrill(pluginConfig, generalConfig) {
    this.pluginConfig = pluginConfig;
    this.generalConfig = generalConfig;
}

Mandrill.prototype.notify = async function notify(message, lastErrorTime, failureCount, job) {
    if (!message.manualStop) {
        var jobId = message.jobId;
        var runId = message.runId;

        var statusDescription = 'Unknown Status';

        if (message.status === 'fail') {
            statusDescription = 'Job failed';
        }
        else if (message.status === 'success') {
            statusDescription = 'Job recovered from last fail';
        }

        var html;
        if (job && job.name) {
            html = `<b>${statusDescription}.</b> View job: <a href="http://${this.pluginConfig.web_host}/run/${runId}">${job.name}.</a>`;
        }
        else {
            html = `<b>${statusDescription}.</b> <a href="http://${this.pluginConfig.web_host}/run/${runId}">Click here to view job.</a>`;
        }

        var body = {
            'key': this.pluginConfig.key,
            'message': {
                'from_email': this.pluginConfig.from_email,
                'to': [
                    {
                        'email': this.pluginConfig.to_email,
                        'name': this.pluginConfig.from_name,
                        'type': 'to'
                    }
                ],
                'autotext': 'true',
                'subject': statusDescription,
                'html': html
            }
        };

        try {
            await axios.post("https://mandrillapp.com/api/1.0/messages/send.json", body);
            debug('Sent message jobId: %s, statusDescription: %s', jobId, statusDescription);
        }
        catch (err) {
            debug('Error sending message err: %O', error);
            console.error("Mandrill error: " + error);
        }
    }
};

module.exports = Mandrill;