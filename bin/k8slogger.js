#! /usr/bin/env node
'use strict';

const path = require('path');

const chokidar = require('chokidar');
const debug = require('debug')('tilloo:k8slogger');

const constants = require('../lib/constants');
const k8sClient = require('../lib/k8s/clientFactory');
const LogForwarder = require('../lib/logforwarder');

const _logRoot = '/var/log/containers/';
const _processStartTime = new Date();
const _runningLoggers = {};

debug(`Starting watch for namespace: ${constants.NAMESPACE} on dir: ${_logRoot}`);
const logWatcher = chokidar.watch(_logRoot, { persistent: true, usePolling: true, followSymlinks: true });

logWatcher.on('add', (filePath, stats) => {
    debug(`file added: ${filePath}`);
    const fileName = path.basename(filePath, '.log');
    const fileNameParts = fileName.split('_');
    // Should be exactly three parts.  name_namespace_containerId and are only
    // interested in our namespace
    if (fileNameParts.length === 3 && fileNameParts[1] === constants.NAMESPACE) {
        const nameParts = fileNameParts[0].split('-');
        // jobid-runid-unique4chars
        if (nameParts.length === 3) {
            const jobId = nameParts[0];
            const runId = nameParts[1];

            if (!_runningLoggers[runId]) {
                debug(`Starting logging for jobId: ${jobId}, runId: ${runId}, filename: ${filePath}`);
                _runningLoggers[runId] = new LogForwarder(runId, filePath, stats.birthtime < _processStartTime);
                _runningLoggers[runId].start();
            }
            else {
                debug(`logger already running for runId: ${runId}, filename: ${fileName}`);
            }
        }
        else {
            debug(`improperly formed name ${fileNameParts[0]}`);
        }
    }
    else {
        debug(`namespace doesn't match or improperly formed log filename ${fileName}`);
    }
});

// Check to see if the various containers are done running
let _runningCheck = false;
setInterval(async function () {
    // Prevent re-entrancy
    if (!_runningCheck) {
        debug('Starting liveness check');
        _runningCheck = true;
        try {
            for (const runId in _runningLoggers) { // eslint-disable-line guard-for-in
                debug(`Checking runId: ${runId}`);
                const jobs = await k8sClient.api.batch.listNamespacedJob(constants.NAMESPACE, undefined, undefined, undefined, undefined, `runId={runId}`, 1, undefined, undefined, false, undefined); // eslint-disable-line no-await-in-loop
                debug('checking job', jobs);
                if (jobs.body.items.length > 0) {
                    const job = jobs.body.items[0];
                    debug('job', job);
                    if (job.status.completionTime || job.status.failed) {
                        debug(`Stopping tail on runId: ${runId}`);
                        _runningLoggers[runId].stop();
                        delete _runningLoggers[runId];
                    }
                }
                else {
                    debug(`Job not found stopping tail on runId: ${runId}`);
                    _runningLoggers[runId].stop();
                    delete _runningLoggers[runId];
                }
            }
        }
        catch (e) {
            console.error('Liveness check error', e);
        }
        debug('Finished liveness check');
        _runningCheck = false;
    }
}, 1000 * 60 * 5);
