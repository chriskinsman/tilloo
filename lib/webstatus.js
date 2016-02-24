var config = require('./config');

var io = require('socket.io')(config.scheduler.port);

var WebStatus = {};


WebStatus.sendLogOutput = function sendLogOutput(runId, output) {
    io.emit('log', {runId: runId, output: output});
};

WebStatus.sendStatus = function sendStatus(jobId, runId, statusUpdate) {
    statusUpdate.runId = runId;
    statusUpdate.jobId = jobId;
    io.emit('status', statusUpdate);
};

WebStatus.sendJobChange = function sendJobChange(jobId) {
    io.emit('jobchange', {jobId: jobId});
};

module.exports = WebStatus;
