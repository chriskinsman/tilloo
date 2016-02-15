var io = require('socket.io')(7700);

var WebStatus = {};


WebStatus.sendLogOutput = function sendLogOutput(runId, output) {
    io.emit('log', {runId: runId, output: output});
};


WebStatus.sendStatus = function sendStatus(runId, statusUpdate) {
    statusUpdate.runId = runId;
    io.emit('status', statusUpdate);
};


module.exports = WebStatus;
