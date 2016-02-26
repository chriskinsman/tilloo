
  A distributed cron with cli and web ui

  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  [![Build Status][shippable-image]][shippable-url]

## Installation

```bash
git clone https://github.com/chriskinsman/tilloo.git
cd tilloo
npm link
```

## Features

  * Full cli
  * Web based UI with real time status udpates
  * Multiple workers in multiple targetable groups
  * No downtime deploys
  * Up and running in 15 minutes.
  
## Background
  
I have been a long time user of Sooner.io <https://github.com/seven1m/sooner.io> but have hit issues around
zero downtime deployments and worker scale out. We looked at extending Sooner.io but the original author is no
longer maintaining it and it has some fundamental architectural issues that would require a significant overhaul
to hit our goals. 

We evaluated Chronos <https://mesos.github.io/chronos/> but found it to be quite a bit more
complex than what we needed.  That complexity came with overhead in terms of getting it setup, etc.

I wrote this to help my startup get past these issues.

## Getting Started

### Prerequisites

We leverage:
 * mongodb <https://www.mongodb.com/> for storage
 * disque <https://github.com/antirez/disque> for communication
 
 
Both of these must be installed prior to using Tilloo.

### Configuration

The default configuration is:
 * Local install of mongodb on port 27017
 * Local install of disque on port 7711
 * Scheduler starts up and listens on port 7700
 * Optional web ui starts up and listens on port 7770

If your environment satisfies the prequisites and is good with the above ports no changes are needed to config.json. 

### Start up services

The typical Tilloo environment consists of:
 * 1 Scheduler
 * 1 or more Workers
 * 1 Web UI
 
To get started run the following commands:

``tilloo-scheduler``

``tilloo-worker``

``tilloo-web``

Open a web browser to http://localhost:7770.

Enjoy!

## CLI Documentation

Running npm link will put symlinks to the tilloo-cli into your /usr/local/bin directory.

### tilloo-cli addjob <schedule> <path> [options]

Adds a job to the system.  

__Arguments__

* schedule - cron style schedule of the form * * * * * *. i.e. 0 0 */1 * * * to run once an hour
* path - Path to the executable to run.  The path is relative to the worker directory.  Absolute paths are allowed.

__Options__

* --jobname <name> - Friendly name of job.  If not specified defaults to the path.
* --timeout <seconds> - Max time to allow job to run before it is killed.
* --queue <queue> - Name of queue to send job to.  Defaults to: tilloo.worker
* --jobargs <args> - Ordered comma separated list of job arguments i.e. --jobargs "300,test"
* --jobdescription <description> - Notes about job
* --mutex <true||false> - If set to true only a single instance of job is allowed to run.  Defaults to true.

### tilloo-cli deletejob <jobId>

Deletes a job from the system.

__Arguments__

* jobId - The id of the job to delete.

### tilloo-cli jobdetail <jobId>

Get a json description of the job. Includes job details not shown elsewhere. Useful for debugging.

__Arguments__

* jobId - The id of the job to get details for.

### tilloo-cli killrun <runId>

__Arguments__

* runId - The id of the run of a job to kill.  The runId is not the same as the jobId.  The runId is associated with a particular run of a job.

__Options__

* --force - If a worker is killed a job can be left in a busy state but will never complete.  If the job has mutex = true it can prevent the next scheduled execution of the job.  These zombie jobs will be cleaned up by default every 5 minutes.  You can use the option to force it to be cleaned up immediately.

### tilloo-cli listjobs

Lists all jobs

### tilloo-cli listruns <jobId>

Lists all runs for a jobId chronological order

__Arguments__

* jobId - The id of the job to list all runs for

### tilloo-cli rundetail <runId>

Get a json description of the run.  Includes run details not shown elsewhere.  Useful for debugging.

__Arguments__

* runId - The id of the run to get details for.

### tilloo-cli runoutput <runId>

Gets the stdout/stderr from the run of a job.

__Arguments__

* runId - The id of the run to get output for.

## People

The author is [Chris Kinsman](https://github.com/chriskinsman)

## License

  [MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/tilloo.svg?style=flat
[npm-url]: https://npmjs.org/package/tilloo
[downloads-image]: https://img.shields.io/npm/dm/tilloo.svg?style=flat
[downloads-url]: https://npmjs.org/package/tilloo
[shippable-image]: https://img.shields.io/shippable/56c277ad1895ca4474741676.svg?style=flat
[shippable-url]: https://app.shippable.com/projects/56c277ad1895ca4474741676
