'use strict';

const async = require('async');
const config = require('./config');
const constants = require('./constants');
const debug = require('debug')('tilloo:rabbitfactory');
const rabbot = require('foo-foo-mq');

let rabbotInstance = null;
let initializing = false;

const exchange = 'tilloo-x';

const connectionConfig = {
    name: 'default',
    user: 'guest',
    pass: 'guest',
    timeout: 30000,
    replyTimeout: 5000,
    failAfter: 120,
    retryLimit: 30,
    host: config.rabbitmq.host,
    port: config.rabbitmq.port
};

async function getInstance() {
    if (!rabbotInstance) {
        if (!initializing) {
            initializing = true;
            try {
                await new Promise((resolve, reject) => {
                    async.retry(
                        {
                            times: 10,
                            interval: function (retryCount) {
                                const wait = 10000 * Math.pow(2, retryCount);
                                debug(`retry ${retryCount}, wait: ${wait} ms`);

                                return wait;
                            }
                        },
                        async function connect() {
                            try {
                                debug(`connecting to instance host: ${config.rabbitmq.host}, port: ${config.rabbitmq.port}`);
                                await rabbot.addConnection(connectionConfig);
                                debug('rabbitmq connected');
                                //Prior to this change, this is the original promise that failed. Publishing will always fail because of this.
                                // https://github.com/arobson/rabbot/issues/108 @edorsey fix
                                rabbot.connections[connectionConfig.name].promise = new Promise(function (resolve, reject) {
                                    resolve();
                                });
                            }
                            catch (e) {
                                console.error('addConnection', e);
                                throw e;
                            }
                        }, (err) => {
                            if (err) {
                                reject(new Error(err));
                            }
                            else {
                                resolve();
                            }
                        });
                });

                // Configure after the addConnection.  If the configure fails it doesn't properly
                // return the promise.  If the addConnection() succeeds first rabbitMq is in a state
                // to configure
                await rabbot.configure({
                    connection: connectionConfig,
                    exchanges: [
                        { name: exchange, type: 'direct' }
                    ],
                    queues: [
                        { name: constants.QUEUES.STATUS, limit: 25 },
                        { name: constants.QUEUES.SCHEDULER, limit: 25 },
                        { name: constants.QUEUES.LOGGER, limit: 25 }
                    ],
                    bindings: [
                        { exchange: exchange, target: constants.QUEUES.STATUS, keys: [constants.QUEUES.STATUS] },
                        { exchange: exchange, target: constants.QUEUES.SCHEDULER, keys: [constants.QUEUES.SCHEDULER] },
                        { exchange: exchange, target: constants.QUEUES.LOGGER, keys: [constants.QUEUES.LOGGER] }
                    ]
                });
                debug('rabbitmq configured');
                rabbotInstance = rabbot;
            }
            catch (e) {
                console.error('Unable to connect to rabbitmq after multiple retries.  Terminating', e);
                process.exit(1);
            }
        }
        else {
            debug('waiting for valid rabbotInstance');
            console.error(new Error('who'));
            await new Promise((resolve) => {
                let checkIntervalId = setInterval(() => {
                    debug('checking for valid rabbotInstance');
                    if (rabbotInstance && checkIntervalId) {
                        debug('got valid rabbotInstance');
                        clearInterval(checkIntervalId);
                        checkIntervalId = undefined;
                        resolve();
                    }
                }, 5000);
            });

        }
    }

    return rabbotInstance;
}

// Opitonal method to simplify initialization
module.exports.initialize = async function initialize() {
    await getInstance();
};

module.exports.subscribe = async function subscribe(queue, handler) {
    try {
        const r = await getInstance();
        console.info(`Listening to ${config.rabbitmq.host}:${config.rabbitmq.port} queue: ${queue}`);
        r.handle(queue, async (message) => {
            debug(`queue: ${queue}, message: ${JSON.stringify(message)}`);
            if (message && message.body) {
                try {
                    const res = await handler(message.body);
                    if (res) {
                        debug(`queue: ${queue}, ack`);
                        message.ack();
                    }
                    else {
                        debug(`queue: ${queue}, reject`);
                        message.reject();
                    }
                }
                catch (e) {
                    console.error(e);
                    message.reject();
                }
            }
            else {
                debug(`no message body queue: ${queue}, message: ${JSON.stringify(message)}`);
            }
        }, queue);
        await r.startSubscription(queue);
    }
    catch (e) {
        console.error(`Unable to start subscription: ${queue}`, e);
        throw new Error('Unable to subscribe');
    }
};

module.exports.publish = async function publish(queue, message) {
    try {
        debug(`Publishing message to queue: ${queue}`);
        const r = await getInstance();
        await r.publish(exchange, {
            type: queue,
            routingKey: queue,
            body: message
        });
    }
    catch (e) {
        console.error(`Unable to publish message to queue: ${queue}, message: ${message}`, e);
        throw new Error('Unable to publish message');
    }
};

process.on('beforeExit', async (code) => {
    if (rabbotInstance) {
        debug('Shutting down rabbitmq connection');
        await rabbotInstance.shutdown();
    }
});