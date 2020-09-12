'use strict';

const config = require('./config');
const constants = require('./constants');
const debug = require('debug')('tilloo:rabbitFactory');
const rabbot = require('rabbot');

let rabbotInstance = null;
let initializing = false;

const exchange = 'tilloo-x';

async function getInstance() {
    if (!rabbotInstance) {
        if (!initializing) {
            initializing = true;
            try {
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
                rabbotInstance = rabbot;
            }
            catch (e) {
                console.error('Unable to connect to rabbitmq.  Terminating', e);
                process.exit(1);
            }
        }
        else {
            debug('waiting for valid rabbotInstance');
            await new Promise(resolve => {
                let checkIntervalId = setInterval(() => {
                    debug('checking for valid rabbotInstance');
                    if (rabbotInstance && checkIntervalId) {
                        debug('got valid rabbotInstance');
                        clearInterval(checkIntervalId);
                        checkIntervalId = undefined;
                        resolve();
                    }
                }, 500);
            });

        }
    }

    return rabbotInstance;
}

module.exports.subscribe = async function subscribe(queue, handler) {
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
};

module.exports.publish = async function publish(queue, message) {
    const r = await getInstance();

    await r.publish(exchange, {
        type: queue,
        routingKey: queue,
        body: message
    });
};

process.on('beforeExit', async (code) => {
    if (rabbotInstance) {
        debug('Shutting down rabbitmq connection');
        await rabbotInstance.shutdown();
    }
});