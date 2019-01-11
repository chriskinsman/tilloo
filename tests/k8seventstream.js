'use strict';

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:tests/k8seventstream');
const JSONStream = require('json-stream');

const k8sClient = require('../lib/k8s/clientFactory');

let k8sStream;
let jsonStream;
let lastResourceVersion = null;

function initializeStream() {
    debug(`Initializing with resourceVersion: ${lastResourceVersion}`);
    const streamArgs = {};
    if (lastResourceVersion) {
        streamArgs.resourceVersion = lastResourceVersion;
    }

    k8sStream = k8sClient.apis.v1.watch.namespaces(constants.NAMESPACE).events.getStream({ qs: streamArgs });
    jsonStream = new JSONStream();
    k8sStream.pipe(jsonStream);
    jsonStream.on('data', (streamData) => {
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
