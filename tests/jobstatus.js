'use strict';

const constants = require('../lib/constants');

const debug = require('debug')('tilloo:tests/jobstatus');

const k8sClient = require('../lib/k8s/clientFactory');

async function main() {
    const jobs = await k8sClient.api.batch.listNamespacedJob(constants.NAMESPACE, undefined, undefined, undefined, undefined, `runId=5f7152df27bf52b4ee3000a5`, 1, undefined, undefined, false, undefined);
    console.dir(jobs);
}

main();