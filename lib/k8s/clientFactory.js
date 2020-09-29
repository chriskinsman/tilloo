const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

module.exports.api = {};
module.exports.api.core = kc.makeApiClient(k8s.CoreV1Api);
module.exports.api.batch = kc.makeApiClient(k8s.BatchV1Api);
module.exports.watch = new k8s.Watch(kc);