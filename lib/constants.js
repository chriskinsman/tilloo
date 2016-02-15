var Constants = {};

Constants.QUEUE_PREFIX = 'tilloo.';

Constants.QUEUES = {};
Constants.QUEUES.LOGGER = Constants.QUEUE_PREFIX + 'log';
Constants.QUEUES.STATUS = Constants.QUEUE_PREFIX + 'status';
Constants.QUEUES.SCHEDULER = Constants.QUEUE_PREFIX + 'scheduler';
Constants.QUEUES.DEFAULT_WORKER = Constants.QUEUE_PREFIX + 'worker';

module.exports = Constants;