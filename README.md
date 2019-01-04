
  A distributed cron with cli and web ui

  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  [![Build Status][shippable-image]][shippable-url]

## Installation

Prerequisites:
- a running kubernetes installation
- kubectl on the local machine connected to the remote k8s cluster
- ingress configured on remote cluster
- helm configured on remote cluster

Steps:
- change hostname in k8s/config.json and k8s/app.yaml
- docker build -t <yourrepo>:<yourtag> .
- docker push <yourrepo>:<yourtag>
- update k8s/app.yaml to reference your repo and tag
- run k8s/install.sh

## Features

  * Full cli
  * Web based UI with real time status udpates
  * Multiple workers in multiple targetable groups
  * No downtime deploys
  * Up and running in 15 minutes.
  
## Recent Changes

Tilloo has been a great tool for distributed cron at my current startup for the last four years. We are now moving to containers and want to add the ability to schedule runs in containers.  As we thought through this we decided to radically change the implementation of Tilloo.  I have created a v1.0 branch for folks who want to continue to use the older version.  Master will become the containerized implementation.  I plan on making the following changes:
 
  * Eliminate worker.  Scheduler will instead schedule container execution against AWS EKS / Kubernetes
  * Web interface will change to allow you to specify parameters to launch containers using Kubernetes Jobs.
  * Scheduler will run in a Kubernetes deployment
  * Web will run in a Kubernetes deployment

## Background
  
I have been a long time user of Sooner.io <https://github.com/seven1m/sooner.io> but have hit issues around
zero downtime deployments and worker scale out. We looked at extending Sooner.io but the original author is no
longer maintaining it and it has some fundamental architectural issues that would require a significant overhaul
to hit our goals. 

We evaluated Chronos <https://mesos.github.io/chronos/> but found it to be quite a bit more
complex than what we needed.  That complexity came with overhead in terms of getting it setup, etc.

I wrote this to help my startup get past these issues.

We evaluated the built in cron support in k8s 1.10 but found it lacking in terms of tracking what each job is doing
and liked the realtime nature of this solution.  We liked the concept of Jobs and the ability to schedule them across the k8s cluster.  We also liked the deployment flexibility of containers.  This motivated us to update tilloo to focus on a containerized workload on k8s.

## Getting Started

### Prerequisites

We leverage:
 * mongodb <https://www.mongodb.com/> for storage
 * disque <https://github.com/antirez/disque> for communication
 
 
Mongodb will be installed using helm with the default install script. The app.yaml will run a disque pod.

### Configuration

The default configuration is:
 * StatefulSet running mongodb in the tilloo-services namespace on port 27017
 * Deployment running disque on port 7711
 * Deployment running scheduler listening on port 7700 with an ingress configured
 * Deployment running web listening on port 7770 with an ingress configured
 * DaemonSet running a logger service on each node

If your environment satisfies the prequisites and is good with the above ports you only need to update the host name in config.json. 

### Start up services

The typical Tilloo environment consists of:
 * 1 Scheduler
 * 1 Web UI
 * 1 logger on each k8s node
 
 Once everything is installed in k8s open a web browser to http://<yourhostname>:7770.

Enjoy!

## CLI Documentation

In a k8s environment the cli is best run from an interactive shell started on the k8s cluster inside the tilloo-services namespace.

Running npm link will put symlinks to the tilloo-cli into your /usr/local/bin directory.

### tilloo-cli addjob &lt;schedule&gt; &lt;imageuri&gt; [options]

Adds a job to the system.  

__Arguments__

* schedule - cron style schedule of the form * * * * * *. i.e. 0 0 */1 * * * to run once an hour
* path - Path to the executable to run.  The path is relative to the worker directory.  Absolute paths are allowed.

__Options__

* --jobname &lt;name&gt; - Friendly name of job.  If not specified defaults to the path.
* --path &lt;path&gt; - Optional path to executable to run inside container
* --timeout &lt;seconds&gt; - Max time to allow job to run before it is killed.
* --nodeselector &lt;nodeselector&gt; - Node selector expression to tie run of job to a subset of nodes
* --jobargs &lt;args&gt; - Ordered comma separated list of job arguments i.e. --jobargs "300,test"
* --jobdescription &lt;description&gt; - Notes about job
* --mutex &lt;true||false&gt; - If set to true only a single instance of job is allowed to run.  Defaults to true.

### tilloo-cli deletejob &lt;jobId&gt;

Deletes a job from the system.

__Arguments__

* jobId - The id of the job to delete.

### tilloo-cli expireruns &lt;days&gt;

Each run represents a document in mongodb.  Each log line is also a document. If you have jobs that run
frequently this can impact the performance of mongodb.  This command line allows you to expire runs and
their logs from mongodb based on the created at date of the run.  The days argument represents how many
days worth of data to keep.  If you specify 7 days any runs created more than 7 days ago will be expired.

__Arguments__

* jobId - The id of the job to delete.


### tilloo-cli jobdetail &lt;jobId&gt;

Get a json description of the job. Includes job details not shown elsewhere. Useful for debugging.

__Arguments__

* jobId - The id of the job to get details for.

### tilloo-cli killrun &lt;runId&gt;

__Arguments__

* runId - The id of the run of a job to kill.  The runId is not the same as the jobId.  The runId is associated with a particular run of a job.

__Options__

* --force - If a worker is killed a job can be left in a busy state but will never complete.  If the job has mutex = true it can prevent the next scheduled execution of the job.  These zombie jobs will be cleaned up by default every 5 minutes.  You can use the option to force it to be cleaned up immediately.

### tilloo-cli listjobs

Lists all jobs

### tilloo-cli listruns &lt;jobId&gt;

Lists all runs for a jobId chronological order

__Arguments__

* jobId - The id of the job to list all runs for

### tilloo-cli rundetail &lt;runId&gt;

Get a json description of the run.  Includes run details not shown elsewhere.  Useful for debugging.

__Arguments__

* runId - The id of the run to get details for.

### tilloo-cli runoutput &lt;runId&gt;

Gets the stdout/stderr from the run of a job.

__Arguments__

* runId - The id of the run to get output for.

## Config Documentation

The config file has sensible defaults filled in.  All keys present in the shipped config file must remain.  Removing settings will cause tilloo to fail to run.

__Settings__

* db - Mongodb database connection string.  This is passed directly to mongoose under the covers and supports any mongodb options.
* disque - Settings for disque. This whole block is passed to <https://www.npmjs.com/package/disqueue-node>. Any valid options for disqueue-node will work here.
* scheduler - Settings pertaining to the scheduler
  * host - The host the scheduler resides on. This is used by tilloo-web to connect to the web sockets interface the scheduler exposes.
  * port - The port the web sockets interface is exposed on.
  * zombieAge - If a job hasn't seen a heartbeat in this many minutes it is marked as failed.
  * zombieFrequency - How frequently the zombie garbage collector should start in minutes
* web - Settings pertaining to the web interface
  * port - The port to start the web interface on  

## Notifications

There are plugins available to send notifications to your monitoring system of choice.  A plugin to send email via Mandrill/MailChimp is included in the project. 

Plugins:
  * [Mandrill/MailChimp](https://www.npmjs.com/package/tilloo-plugin-mandrill)

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
