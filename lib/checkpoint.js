'use strict';

const Checkpoint = require('../models/checkpoint');
const debug = require('debug')('tilloo:lib:checkpoint');

let lastResourceVersion = null;
let initializing = false;

module.exports.getResourceVersion = async function getResourceVersion() {
    if (!lastResourceVersion) {
        if (!initializing) {
            initializing = true;
            try {
                debug('Getting checkpoint from mongodb');
                lastResourceVersion = await Checkpoint.getInitialResourceVersion();
                if (!lastResourceVersion) {
                    debug('No checkpoint found creating');
                    lastResourceVersion = await Checkpoint.initializeResourceVersion();
                }

                debug(`returning resourceVersion: ${lastResourceVersion}`);

                return lastResourceVersion;
            }
            catch (err) {
                console.error('Error getting job checkpoint', err);
                throw new Error('Error getting checkpoint');
            }
        }
        else {
            debug('waiting for valid resourceVersion');
            await new Promise((resolve) => {
                let checkIntervalId = setInterval(() => {
                    debug('checking for valid resourceVersion');
                    if (lastResourceVersion && checkIntervalId) {
                        debug('got valid resourceVersion');
                        clearInterval(checkIntervalId);
                        checkIntervalId = undefined;
                        resolve();
                    }
                }, 500);
            });

            debug(`returning after wait resourceVersion: ${lastResourceVersion}`);

            return lastResourceVersion;
        }
    }
    else {
        debug(`returning from memory resourceVersion: ${lastResourceVersion}`);

        return lastResourceVersion;
    }
};

module.exports.setResourceVersion = async function setResourceVersion(currentResourceVersion) {
    const resourceVersion = parseInt(currentResourceVersion, 10);
    if (resourceVersion > lastResourceVersion) {
        lastResourceVersion = resourceVersion;
        try {
            await Checkpoint.saveResourceVersion(lastResourceVersion);
            debug(`Updated lastResourceVersion: ${lastResourceVersion}`);
        }
        catch (err) {
            console.error('error updating checkpoint resource version', err);
            // Don't rethrow here.  Not fatal as we can keep running and may be able
            // to save a later resourceVersion
        }
    }

    return lastResourceVersion;
};