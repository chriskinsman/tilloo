const Client = require('kubernetes-client').Client;

const client = new Client();

async function main() {
    await client.loadSpec();

    // Call some other api to force authentication
    await client.api.v1.namespaces.get();
}

// Warning!  There is a chance if the client is used prior to main()
// doing initialization you could be in an indeterminate state
main();

module.exports = client;