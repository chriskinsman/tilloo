'use strict';

const util = require('util');
const EventEmitter = require('events').EventEmitter;

const config = require('../config');
const constants = require('../constants');
const k8sClient = require('./clientFactory');

const debug = require('debug')('tilloo:k8sjob');

debug('config.jobEnvironmentVariables', config.jobEnvironmentVariables);

const jobEnvironmentVariables = [];
if (config.jobEnvironmentVariables) {
    // eslint-disable-next-line guard-for-in
    for (const key in config.jobEnvironmentVariables) {
        jobEnvironmentVariables.push({ name: key, value: config.jobEnvironmentVariables[key] });
    }
}
debug('jobEnvironmentVariables', jobEnvironmentVariables);

class Job extends EventEmitter {
    constructor(jobId, runId, name, imageUri, path, args, nodeSelector, timeout) {
        super();
        const self = this;
        this.jobId = jobId;
        this.runId = runId;
        this.name = name;
        this.imageUri = imageUri;
        this.path = path;
        this.args = args;
        this.timeout = timeout;

        this.command = [this.path].concat(args);
        this.uniqueName = `${jobId}-${runId}`;

        this.jobDef = {
            apiVersion: 'batch/v1',
            kind: 'Job',
            metadata: {
                name: this.uniqueName,
                labels: {
                    jobId: this.jobId,
                    runId: this.runId
                }
            },
            spec: {
                template: {
                    metadata: {
                        labels: {
                            jobId: this.jobId,
                            runId: this.runId
                        }
                    },
                    spec: {
                        containers: [
                            {
                                env: jobEnvironmentVariables,
                                name: this.uniqueName,
                                image: this.imageUri,
                                imagePullPolicy: 'Always',
                                command: this.command
                            }
                        ],
                        restartPolicy: 'Never'
                    }
                },
                backoffLimit: 0,
                ttlSecondsAfterFinished: 3600
            }
        };

        if (this.timeout !== undefined && this.timeout !== 0) {
            this.jobDef.spec.activeDeadlineSeconds = this.timeout;
        }

        if (nodeSelector) {
            const nodeSelectors = nodeSelector.split(',');
            nodeSelectors.forEach(function (selector) {
                const selectorParts = selector.split('=');
                if (selectorParts.length === 2) {
                    if (!self.jobDef.spec.template.spec.nodeSelector) {
                        self.jobDef.spec.template.spec.nodeSelector = {};
                    }
                    self.jobDef.spec.template.spec.nodeSelector[selectorParts[0]] = selectorParts[1];
                }
            });
        }

        debug(`k8s/jobDef`, JSON.stringify(self.jobDef, null, 2));
    }

    start() {
        const self = this;

        debug(`Starting k8Job jobId: ${self.jobId}, runId: ${self.runId}`);

        function errorStatus(err) {
            console.error('script error jobId: %s, runId: %s, path: %s, err: %s', self.jobId, self.runId, self.path, self.args, err);
            self.logOutput(util.format('script error\njobId: %s\nrunId: %s\npath: %s\nerr: %s', self.jobId, self.runId, self.path, self.args, err));

            self.updateStatus({ status: constants.JOBSTATUS.FAIL });
            self.emit('complete');
        }

        try {
            k8sClient.apis.batch.v1.namespaces(constants.NAMESPACE).jobs.post({ body: this.jobDef }).then((job) => {
                debug(`job created`, job);
            }).catch((err) => {
                console.error('job creation err: ', err);
            });
        }
        catch (err) {
            errorStatus(err);
        }
    }

    static async remove(runId) {
        await Promise.all([
            k8sClient.apis.batch.v1.namespaces(constants.NAMESPACE).jobs.delete({ qs: { labelSelector: `runId=${runId}` } }),
            k8sClient.apis.v1.namespaces(constants.NAMESPACE).pods.delete({ qs: { labelSelector: `runId=${runId}` } })
        ]);
    }

    updateStatus(message) {
        message.runId = this.runId;
        message.jobId = this.jobId;
        this.emit('status', message);
    }
}

module.exports = Job;