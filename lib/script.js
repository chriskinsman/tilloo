'use strict';

var fs = require('fs');
var child_process = require('child_process');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var config = require('../lib/config');
var constants = require('../lib/constants');

var debuglog = util.debuglog('TILLOO');

function Script(jobId, runId, path, args, timeout) {
    this.jobId = jobId;
    this.runId = runId;
    this.path = path;
    this.args = args;
    this.timeout = timeout;
    var self = this;

    EventEmitter.call(this);
}
util.inherits(Script, EventEmitter);

Script.prototype.start = function start() {
    var self = this;
    debuglog('script executing jobId: %s, runId: %s, path: %s', this.jobId, this.runId, this.path, this.args);
    var child = child_process.spawn(this.path, this.args || [], {});
    this.updateStatus({status: 'busy', pid: child.pid});
    var timeoutId, workingRefreshId;
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', this.logOutput.bind(this));
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', this.logOutput.bind(this));
    child.on('exit', function(code) {
        debuglog('script complete jobId: %s, runId: %s, path: %s', self.jobId, self.runId, self.path, self.args);
        if(timeoutId) {
            clearTimeout(timeoutId);
        }

        if(workingRefreshId) {
            clearInterval(workingRefreshId);
        }

        var status = code === 0 ? 'success' : 'fail';
        self.updateStatus({status: status, result: code});

        self.emit('complete');
    });

    // Set watchdog timer if needed
    if(self.timeout !== undefined && self.timeout !== 0) {
        debuglog('setting timeout for jobId: %s, runId: %s, timeout: %d', self.jobId, self.runId, self.timeout);
        timeoutId = setTimeout(function() {
            debuglog('killing jobId: %s, runId: %s', self.jobId, self.runId);
            child.kill();
        }, self.timeout * 1000);
    }

    // Timer to keep queued message from delivery
    workingRefreshId = setInterval(function() {
        debuglog('heartbeat jobId: %s, runId: %s', self.jobId, self.runId);
        self.updateStatus({status: 'heartbeat'});
    }, 60000);
};

Script.prototype.logOutput = function logOutput(output) {
    var message = { runId: this.runId, output: output};
    this.emit('output', message);
};


Script.prototype.updateStatus = function updateStatus(message) {
    message.runId = this.runId;
    this.emit('status', message);
};

module.exports = Script;
