const config = require('./config');

const io = require('socket.io')(config.scheduler.port);

const IOStatus = {};


IOStatus.sendLogOutput = function sendLogOutput(runId, output) {
    io.emit('log', { runId: runId, output: output });
};

IOStatus.sendStatus = function sendStatus(jobId, runId, statusUpdate) {
    statusUpdate.runId = runId;
    statusUpdate.jobId = jobId;
    io.emit('status', statusUpdate);
};

IOStatus.sendJobChange = function sendJobChange(jobId) {
    io.emit('jobchange', { jobId: jobId });
};

module.exports = IOStatus;
