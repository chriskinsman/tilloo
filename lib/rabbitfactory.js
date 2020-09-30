'use strict';

const async = require('async');
const config = require('./config');
const constants = require('./constants');
const debug = require('debug')('tilloo:rabbitfactory');
const rabbot = require('rabbot');

let rabbotInstance = null;
let initializing = false;

const exchange = 'tilloo-x';

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
                                const wait = 5000 * Math.pow(2, retryCount);
                                debug(`retry ${retryCount}, wait: ${wait} ms`);

                                return wait;
                            }
                        },
                        async function initialize() {
                            debug(`configuring instance host: ${config.rabbitmq.host}, port: ${config.rabbitmq.port}`);
                            await rabbot.configure({
                                connection: {
                                    name: 'default',
                                    user: 'guest',
                                    pass: 'guest',
                                    host: config.rabbitmq.host,
                                    port: config.rabbitmq.port
                                },
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
                            debug('rabbitmq connected');
                            console.dir(rabbot, { depth: 10 });
                            rabbotInstance = rabbot;
                        }, (err) => {
                            if (err) {
                                reject(new Error(err));
                            }
                            else {
                                resolve();
                            }
                        });
                });
            }
            catch (e) {
                console.error('Unable to connect to rabbitmq after multiple retries.  Terminating', e);
                process.exit(1);
            }
        }
        else {
            debug('waiting for valid rabbotInstance');
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
        const r = await getInstance();
        console.dir(r, { depth: 10 });
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