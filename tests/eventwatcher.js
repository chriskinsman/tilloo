'use strict';

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:tests/eventwatcher');

const k8sClient = require('../lib/k8s/clientFactory');

let lastResourceVersion = null;

async function initializeStream() {
    console.log(new Date());
    const watchArgs = { allowWatchBookmarks: true };
    if (lastResourceVersion) {
        watchArgs.resourceVersion = lastResourceVersion;
    }

    try {
        await k8sClient.watch.watch(`/api/v1/namespaces/${constants.NAMESPACE}/events`, watchArgs,
            (type, apiObj, watchObj) => {
                if (apiObj.metadata && apiObj.metadata.resourceVersion) {
                    lastResourceVersion = apiObj.metadata.resourceVersion;
                    debug('Updating lastResourceVersion', lastResourceVersion);
                }
                debug(`Type: ${type}`);
                debug(apiObj);
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
}

initializeStream();
