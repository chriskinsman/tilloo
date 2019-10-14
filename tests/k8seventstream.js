'use strict';

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:tests/k8seventstream');

const k8sClient = require('../lib/k8s/clientFactory');

let k8sStream;
let lastResourceVersion = null;

async function initializeStream() {
    debug(`Initializing with resourceVersion: ${lastResourceVersion}`);
    const streamArgs = {};
    if (lastResourceVersion) {
        streamArgs.resourceVersion = lastResourceVersion;
    }

    k8sStream = await k8sClient.api.v1.watch.namespaces(constants.NAMESPACE).events.getObjectStream({ qs: streamArgs });
    k8sStream.on('data', (streamData) => {
        console.dir(streamData);
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
