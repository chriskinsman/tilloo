'use strict';

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:tests/k8sjobstream');

const k8sClient = require('../lib/k8s/clientFactory');

let lastResourceVersion = null;

async function initializeStream() {
    console.log(new Date());
    const watchArgs = { allowWatchBookmarks: true };
    if (lastResourceVersion) {
        watchArgs.resourceVersion = lastResourceVersion;
    }

    try {
        await k8sClient.watch.watch(`/apis/batch/v1/namespaces/${constants.NAMESPACE}/jobs`, watchArgs,
            (type, apiObj, watchObj) => {
                if (apiObj.metadata && apiObj.metadata.resourceVersion) {
                    lastResourceVersion = apiObj.metadata.resourceVersion;
                    debug('Updating lastResourceVersion', lastResourceVersion);
                }

                switch (type) {
                    case 'ADDED':
                        debug('Job added');
                        break;

                    case 'MODIFIED':
                        debug('Job modified');
                        break;

                    case 'DELETED':
                        debug('Job deleted');
                        break;

                    case 'BOOKMARK':
                        debug('Bookmark received');
                }
            },
            (err) => {
                console.log(new Date());
                console.log('Restarting');
                initializeStream();
                if (err) {
                    console.error(err);
                }
            });
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
    // k8sStream = await k8sClient.apis.batch.v1.watch.namespaces(constants.NAMESPACE).jobs.getObjectStream({ qs: streamArgs });
    // k8sStream.on('data', (streamData) => {
    //     console.dir(streamData, { depth: 4 });
    //     debug('streamData', streamData);

    //     if (streamData.metadata && streamData.metadata.resourceVersion) {
    //         lastResourceVersion = streamData.metadata.resourceVersion;
    //         debug('Updating lastResourceVersion', lastResourceVersion);
    //     }
    // });
}

initializeStream();
