'use strict';
const k8sClient = require('../lib/k8s/clientFactory');


(async () => {
    try {
        await k8sClient.loadSpec();
        const jobs = await k8sClient.apis.batch.v1.namespaces('tilloo-jobs').job.get({ qs: { labelSelector: `runId=5c3650e07020ab0001c25cde` } });
        console.dir(jobs);
        console.dir(jobs.body.items[0]);
        const res = await k8sClient.apis.batch.v1.namespaces('tilloo-jobs').job.delete({ qs: { labelSelector: `runId=5c3650e07020ab0001c25cde` } });
        console.dir(res);
    }
    catch (e) {
        console.error(e);
    }
})();
