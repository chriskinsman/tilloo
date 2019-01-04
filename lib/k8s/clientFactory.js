const Client = require('kubernetes-client').Client;
const Config = require('kubernetes-client').config;

const client = new Client(
    {
        //config: Config.fromKubeconfig()
        config: Config.getInCluster()
    }
);

async function main() {
    await client.loadSpec();

    // Call some other api to force authentication
    await client.api.v1.namespaces.get();
}

main();

module.exports = client;