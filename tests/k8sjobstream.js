'use strict';

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:tests/k8sjobstream');

const k8sClient = require('../lib/k8s/clientFactory');

let k8sStream;
let lastResourceVersion = null;

async function initializeStream() {
    debug(`Initializing jobStream with resourceVersion: ${lastResourceVersion}`);
    const streamArgs = {};
    if (lastResourceVersion) {
        streamArgs.resourceVersion = lastResourceVersion;
    }

    k8sStream = await k8sClient.apis.batch.v1.watch.namespaces(constants.NAMESPACE).jobs.getObjectStream({ qs: streamArgs });
    k8sStream.on('data', (streamData) => {
        console.dir(streamData, { depth: 4 });
        debug('streamData', streamData);

        if (streamData.metadata && streamData.metadata.resourceVersion) {
            lastResourceVersion = streamData.metadata.resourceVersion;
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
