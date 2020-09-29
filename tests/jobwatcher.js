'use strict';

// Needs a config.json and mongodb to test with

const constants = require('../lib/constants');
const debug = require('debug')('tilloo:tests/jobwatcher');
const Watcher = require('../lib/k8s/watcher');

const watcher = new Watcher(`/apis/batch/v1/namespaces/${constants.NAMESPACE}/jobs`, (type, apiObj, watchObj) => {
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
});

watcher.start();
