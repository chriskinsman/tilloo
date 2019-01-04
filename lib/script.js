'use strict';

const childProcess = require('child_process');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:script');

function Script(jobId, runId, path, args, timeout) {
    this.jobId = jobId;
    this.runId = runId;
    this.path = path;
    this.args = args;
    this.timeout = timeout;
    this.manualStop = false;

    EventEmitter.call(this);
}
util.inherits(Script, EventEmitter);

Script.prototype.start = function start() {
    const self = this;
    let timeoutId;

    function cleanup() {
        if(timeoutId) {
            clearTimeout(timeoutId);
        }
        if(workingRefreshId) {
            clearInterval(workingRefreshId);
        }
    }

    function errorStatus(err) {
        console.error('script error jobId: %s, runId: %s, path: %s, err: %s', self.jobId, self.runId, self.path, self.args, err);
        self.logOutput(util.format('script error\njobId: %s\nrunId: %s\npath: %s\nerr: %s', self.jobId, self.runId, self.path, self.args, err));
        cleanup();

        self.updateStatus({ status: constants.JOBSTATUS.FAIL });
        self.emit('complete');
    }

    try{

        this.child = childProcess.spawn(this.path, this.args || [], {});
        this.updateStatus({ status: constants.JOBSTATUS.BUSY, pid: this.child.pid });
        this.emit('pid', this.child.pid);
        this.child.stdout.setEncoding('utf8');
        this.child.stdout.on('data', this.logOutput.bind(this));
        this.child.stderr.setEncoding('utf8');
        this.child.stderr.on('data', this.logOutput.bind(this));

        this.child.on('error', errorStatus);

        this.child.on('exit', function(code) {
            debug('script complete jobId: %s, runId: %s, path: %s', self.jobId, self.runId, self.path, self.args);
            cleanup();

            const status = code === 0 ? constants.JOBSTATUS.SUCCESS : constants.JOBSTATUS.FAIL;
            const statusMessage = { status: status, result: code };
            if(statusMessage.status === constants.JOBSTATUS.SUCCESS && self.manualStop) {
                statusMessage.manualStop = true;
            }
            self.updateStatus(statusMessage);
            self.emit('complete');
        });

        // Set watchdog timer if needed
        if(self.timeout !== undefined && self.timeout !== 0) {
            debug('setting timeout for jobId: %s, runId: %s, timeout: %d', self.jobId, self.runId, self.timeout);
            timeoutId = setTimeout(function() {
                debug('killing jobId: %s, runId: %s', self.jobId, self.runId);
                self.child.kill();
            }, self.timeout * 1000);
        }

    }
    catch (err) {
        errorStatus(err);
        // var statusMessage = {status: constants.JOBSTATUS.FAIL};
        // if(self.manualStop) {
        //     statusMessage.type = constants.KILLTYPE.MANUAL;
        // }
        //
        // self.updateStatus(statusMessage);
        // self.emit('complete');
    }

    // Set watchdog timer if needed
    if(self.timeout !== undefined && self.timeout !== 0) {
        debug('setting timeout for jobId: %s, runId: %s, timeout: %d', self.jobId, self.runId, self.timeout);
        timeoutId = setTimeout(function() {
            debug('killing jobId: %s, runId: %s', self.jobId, self.runId);
            self.child.kill();
        }, self.timeout * 1000);
    }


    // Timer to keep queued message from delivery
    const workingRefreshId = setInterval(function() {
        debug('heartbeat jobId: %s, runId: %s', self.jobId, self.runId);
        self.updateStatus({ status: 'heartbeat' });
    }, 60000);

};

Script.prototype.stop = function stop() {
    this.manualStop = true;
    this.child.kill();
};

Script.prototype.logOutput = function logOutput(output) {
    const message = { runId: this.runId, output: output };
    this.emit('output', message);
};


Script.prototype.updateStatus = function updateStatus(message) {
    message.runId = this.runId;
    message.jobId = this.jobId;
    this.emit('status', message);
};

module.exports = Script;
