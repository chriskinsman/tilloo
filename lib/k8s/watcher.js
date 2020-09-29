'use strict';

const debug = require('debug')('tilloo:k8s/watcher');
const checkpoint = require('../checkpoint');
const k8sClient = require('./clientFactory');

class Watcher {
    constructor(apiPath, eventCallback) {
        this.apiPath = apiPath;
        this.eventCallback = eventCallback;
    }

    async start() {
        const self = this;
        debug(`starting watcher apiPath: ${self.apiPath} watcher`);
        try {
            debug(`Getting watcher apiPath: ${self.apiPath} checkpointed resourceVersion`);
            const resourceVersion = await checkpoint.getResourceVersion();
            this.main(resourceVersion);
        }
        catch (err) {
            console.error(`Error watcher apiPath: ${self.apiPath} getting checkpointed resourceVersion`, err);
            // Start using a resourceVersion of null to start at beginning
            this.main(null);
        }
    }

    main(initialResourceVersion) {
        const self = this;
        let lastResourceVersion = initialResourceVersion;

        async function initializeStream() {
            const watchArgs = { allowWatchBookmarks: true };
            if (lastResourceVersion) {
                watchArgs.resourceVersion = lastResourceVersion;
            }

            debug(`Initializing watcher apiPath: ${self.apiPath} resourceVersion: ${lastResourceVersion}`);
            await k8sClient.watch.watch(self.apiPath, watchArgs,
                async (type, apiObj, watchObj) => {
                    debug(`${self.apiPath}`, watchObj);

                    // We can get this if the resourceVersion is too old.  This will restart things
                    if (apiObj.kind === 'Status' && apiObj.status === 'Failure' && apiObj.reason === 'Expired') {
                        debug(`watcher apiPath: ${self.apiPath} resourceVersion too old reinitializing`);
                        lastResourceVersion = null;

                        return setImmediate(initializeStream);
                    }

                    if (apiObj.metadata && apiObj.metadata.resourceVersion) {
                        lastResourceVersion = await checkpoint.setResourceVersion(apiObj.metadata.resourceVersion);
                    }

                    await self.eventCallback(type, apiObj, watchObj);
                },
                (err) => {
                    if (err) {
                        console.error('Error watching', err);
                    }

                    debug(`Restarting watcher apiPath: ${self.apiPath}`);
                    initializeStream();
                }
            );
        }

        initializeStream();
    }
}

module.exports = Watcher;
