'use strict';

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:k8sstream');
const JSONStream = require('json-stream');

const k8sClient = require('../lib/k8s/clientFactory');

let jobStream;
let jsonJobStream;
let lastResourceVersion = 13010;

function initializeStream() {
    debug(`Initializing jobStream with resourceVersion: ${lastResourceVersion}`);
    const jobArgs = {};
    if (lastResourceVersion) {
        jobArgs.resourceVersion = lastResourceVersion;
    }

    jobStream = k8sClient.apis.batch.v1.watch.namespaces(constants.NAMESPACE).jobs.getStream({ qs: jobArgs });
    jsonJobStream = new JSONStream();
    jobStream.pipe(jsonJobStream);
    jsonJobStream.on('data', (jobData) => {
        debug('jobData', jobData);

        if (jobData.metadata && jobData.metadata.resourceVersion) {
            lastResourceVersion = jobData.metadata.resourceVersion;
            debug('Updating lastResourceVersion', lastResourceVersion);
        }

    });

}

k8sClient.loadSpec().then(function () {
    k8sClient.api.v1.namespaces.get().then(function () {
        initializeStream();
        setInterval(initializeStream, 1000 * 60 * 5);
    });
});
