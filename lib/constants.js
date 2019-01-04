const Constants = {};

Constants.NAMESPACE = 'tilloo-jobs';

Constants.QUEUE_PREFIX = 'tilloo.';

Constants.QUEUES = {};
Constants.QUEUES.LOGGER = Constants.QUEUE_PREFIX + 'log';
Constants.QUEUES.STATUS = Constants.QUEUE_PREFIX + 'status';
Constants.QUEUES.SCHEDULER = Constants.QUEUE_PREFIX + 'scheduler';
Constants.QUEUES.DEFAULT_WORKER = Constants.QUEUE_PREFIX + 'worker';
Constants.QUEUES.KILL_PREFIX = Constants.QUEUE_PREFIX + 'kill.';

Constants.SCHEDULERACTION = {};
Constants.SCHEDULERACTION.NEW = 'new';
Constants.SCHEDULERACTION.DELETED = 'deleted';
Constants.SCHEDULERACTION.UPDATED = 'updated';

Constants.JOBSTATUS = {};
Constants.JOBSTATUS.IDLE = 'idle';
Constants.JOBSTATUS.BUSY = 'busy';
Constants.JOBSTATUS.SUCCESS = 'success';
Constants.JOBSTATUS.FAIL = 'fail';

Constants.KILLTYPE = {};
Constants.KILLTYPE.MANUAL = 'manual';
Constants.KILLTYPE.ZOMBIE = 'zombie';

module.exports = Constants;