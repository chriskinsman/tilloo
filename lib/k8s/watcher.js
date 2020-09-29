'use strict';

const debug = require('debug')('tilloo:k8s/watcher');
const Checkpoint = require('../../models/checkpoint');
const k8sClient = require('./clientFactory');

class Watcher {
    constructor(apiPath, eventCallback) {
        this.apiPath = apiPath;
        this.eventCallback = eventCallback;
    }

    async start() {
        debug('starting watcher');
        try {
            debug('Getting checkpoint');
            let checkpoint = await Checkpoint.getInitialResourceVersion();
            if (!checkpoint) {
                debug('No checkpoint found creating');
                checkpoint = await Checkpoint.initializeResourceVersion();
            }
            else {
                debug(`checkpoint resourceVersion:${checkpoint.resourceVersion}`);
            }

            this.main(checkpoint.resourceVersion);
        }
        catch (err) {
            console.error('Error getting job checkpoint', err);
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
                        debug(`resourceVersion too old reinitializing`);
                        lastResourceVersion = null;

                        return setImmediate(initializeStream);
                    }

                    if (apiObj.metadata && apiObj.metadata.resourceVersion) {
                        const currentResourceVersion = parseInt(apiObj.metadata.resourceVersion, 10);
                        if (currentResourceVersion > lastResourceVersion) {
                            lastResourceVersion = currentResourceVersion;
                            try {
                                await Checkpoint.saveResourceVersion(currentResourceVersion);
                                debug(`Updated lastResourceVersion`, currentResourceVersion);
                            }
                            catch (err) {
                                console.error('error updating checkpoint resource version', err);
                            }
                        }
                    }

                    await self.eventCallback(type, apiObj, watchObj);
                },
                (err) => {
                    if (err) {
                        console.error('Error watching', err);
                    }

                    console.log(`Restarting watcher apiPath: ${self.apiPath}`);
                    initializeStream();
                }
            );
        }

        initializeStream();
    }
}

module.exports = Watcher;
