'use strict';

const constants = require('../constants');

const debug = require('debug')('tilloo:k8sjobstatus');
const Disqueue = require('disqueue-node');
const JSONStream = require('json-stream');

const config = require('../config');
const k8sClient = require('./clientFactory');

const disq = new Disqueue(config.disque);

async function main() {
    let jobStream;
    let jsonJobStream;
    let lastResourceVersion;
    await k8sClient.loadSpec();

    function updateStatus(message) {
        debug('Updating status for jobId: %s, runId: %s, status: %s', message.jobId, message.runId, message.status, message);
        disq.addJob({ queue: constants.QUEUES.STATUS, job: JSON.stringify(message), timeout: 0 }, function (err) {
            if (err) {
                console.error('Unable to queue status for jobId: %s, runId: %s, status: %s', message.jobId, message.runId, message);
            }
        });
    }

    function initializeStream() {
        // abort the old stream
        if (jobStream) {
            debug('aborting old stream');
            jobStream.abort();
        }

        debug(`Initializing jobStream with resourceVersion: ${lastResourceVersion}`);
        const resourceVersion = {};
        if (lastResourceVersion) {
            resourceVersion.resourceVersion = lastResourceVersion;
        }

        debug('Job resourceVersion', resourceVersion);
        jobStream = k8sClient.apis.batch.v1.watch.namespaces(constants.NAMESPACE).jobs.getStream({ qs: resourceVersion });
        jsonJobStream = new JSONStream();
        jobStream.pipe(jsonJobStream);
        jsonJobStream.on('data', async (jobData) => {
            debug('jobData', jobData);

            if (jobData.object.metadata && jobData.object.metadata.resourceVersion) {
                lastResourceVersion = jobData.object.metadata.resourceVersion;
                debug('Updated lastResourceVersion', lastResourceVersion);
            }

            if ((jobData.type === 'MODIFIED' || jobData.type === 'DELETED') && jobData.object.status) {
                try {
                    debug(`getting pods for runId: ${jobData.object.metadata.labels.runId}`);
                    const pods = await k8sClient.api.v1.namespaces(constants.NAMESPACE).pods.get({ qs: { labelSelector: `runId=${jobData.object.metadata.labels.runId}` } });
                    debug('pods %O', pods);
                    if (pods.body.items.length > 0) {
                        const pod = await k8sClient.api.v1.namespaces(constants.NAMESPACE).pods.get(pods.body.items[0].metadata.name);
                        debug('pod %O', pod);

                        if (jobData.object.status.active) {
                            updateStatus({ status: constants.JOBSTATUS.BUSY, pod: pod.body.metadata.name, runId: jobData.object.metadata.labels.runId, jobId: jobData.object.metadata.labels.jobId });
                        }
                        else if (jobData.object.status.completionTime) {
                            const completeCondition = jobData.object.status.conditions.find(function (condition) {
                                return condition.type === 'Complete';
                            });

                            const failedCondition = jobData.object.status.conditions.find(function (condition) {
                                return condition.type === 'Failed';
                            });

                            if (failedCondition) {
                                updateStatus({ status: constants.JOBSTATUS.FAIL, pod: pod.body.metadata.name, runId: jobData.object.metadata.labels.runId, jobId: jobData.object.metadata.labels.jobId });
                            }
                            else if (completeCondition) {
                                updateStatus({ status: constants.JOBSTATUS.SUCCESS, pod: pod.body.metadata.name, runId: jobData.object.metadata.labels.runId, jobId: jobData.object.metadata.labels.jobId });
                                // Delete job in 5 minutes
                                setTimeout(async () => {
                                    await Promise.all([
                                        k8sClient.apis.batch.v1.namespaces(constants.NAMESPACE).jobs.delete({ body: { labelSelector: `runId=${jobData.object.metadata.labels.runId}` } }),
                                        k8sClient.apis.v1.namespaces(constants.NAMESPACE).pods.delete({ body: { labelSelector: `runId=${jobData.object.metadata.labels.runId}` } })
                                    ]);
                                }, 1000 * 60 * 5);
                            }
                        }
                        // We got here either because the job has failed or it has been deleted.  If it was deleted but completed
                        // the previous else if clause should have hit
                        else if (jobData.object.status.failed || jobData.type === 'DELETED') {
                            updateStatus({ status: constants.JOBSTATUS.FAIL, pod: pod.body.metadata.name, runId: jobData.object.metadata.labels.runId, jobId: jobData.object.metadata.labels.jobId });
                            // Delete job in 5 minutes
                            setTimeout(async () => {
                                await Promise.all([
                                    k8sClient.apis.batch.v1.namespaces(constants.NAMESPACE).jobs.delete({ body: { labelSelector: `runId=${jobData.object.metadata.labels.runId}` } }),
                                    k8sClient.apis.v1.namespaces(constants.NAMESPACE).pods.delete({ body: { labelSelector: `runId=${jobData.object.metadata.labels.runId}` } })
                                ]);
                            }, 1000 * 60 * 5);
                        }
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
        });

        // Confirmed that this fires
        jobStream.on('close', () => {
            console.error('jobStream close');
        });

        // Unconfirmed that any of the following fire. Placed to monitor
        // and see if they fire in some instances
        jobStream.on('error', (err) => {
            console.error('jobStream error:', err);
        });

        jobStream.on('timeout', (e) => {
            console.error('jobStream timeout', e);
        });

        jobStream.on('aborted', (e) => {
            console.error('jobStream aborted', e);
        });
    }

    initializeStream();
    // Hack to deal with kubernetes-client dropping stream without warning
    setInterval(initializeStream, 1000 * 60 * 15);
}

main();