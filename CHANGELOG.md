# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added

### Changed

## [4.0.13] - 2023-05-18
### Changed
- Moved from vue-cli to Vite
- Moved from momentjs to dayjs
- Updated to node v18.16.0
- Updated construe and cron
- Updated GitHub Action versions
- Split backend from client
- New npm run start command to bring client up for debugging


## [4.0.12] - 2023-05-15
### Changed
- Removed the timestamp prefix from the collected logs on containerd to match docker behavior


## [4.0.3] - 2021-10-20
### Changed
- Fixed issue with missing body-parser

## [4.0.2] - 2021-10-19
### Changed
- Fixed issue with failed disabled jobs still being highlighted in red

## [4.0.1] - 2021-10-18
### Added
- New tooltip to show cron repetition in english
- New tooltip to show next time job runs
- Fix issues with docker builds of web app

## [4.0.0] - 2021-10-09
### Added
- New web interface based on Vue.  You will have to update your web-deployment to start /web/server/index.js

### Changed
- Removed old AngularJS interface
- Update packages

## [3.6.0] - 2021-09-16
### Added
- Support for containerd log formats

### Changed
- Update packages
- Removed body-parser

## [3.5.0] - 2021-08-09
### Changed
- Merged in notification plugins
- Fixed to work with new config format

## [3.4.0] - 2021-04-05
### Changed
- Moved to official @kubernetes-client/javascript
- Refactored RabbitMQ startup in scheduler

## [3.3.0] - 2020-09-30
### Changed
- Update packages
- Fix memory leak (due to @kubernetes/client-node leak)

## [3.2.0] - 2020-09-21
### Changed
- Moved from disqueue to rabbitmq
- Moved to Async/Await
- Updated dependencies

## [2.0.6] - 2019-09-24
### Changed
- Added a+x privileges to bin/*

## [2.0.5] - 2019-09-23
### Changed
- You can now override key config settings using environment variables. Supported overrides include db (MONGODB), scheduler.host (SCHEDULER_HOST), and web.host (WEB_HOST).

## [2.0.4] - 2019-05-08
### Changed
- Simplified port configuration for services and how they are exposed externally.  Now default to port 80 across the board and client side socket.io connections will connect back to source host.  This should enable simple SSL decode in load balancer.

## [2.0.0] - 2019-01-04
### Added
- Support for running the entire project in Kubernetes.

### Changed
- Dropped support for running outside Kubernetes.  Use v1.0.6 and the v1.0 branch for running outside Kubernetes
- Dropped builds of individual containers for each role
- Moves from Ubuntu based containers to Alpine based
- Changed to a multi stage docker build to minimize image size

## [1.0.6] - 2019-01-04
### Added
- package-lock.json to lock packages to specific versions

### Changed
- Eliminated bower and moved to using npm for client side libraries
- Moved to node 10.13.0
- npm install only production packages in build
- Moved from jshint to eslint

## [1.0.5] - 2017-10-13
### Added
- Nothing

### Changed
- Behavior of expireruns.  If a mongodb timeout is encountered it will keep trying to expire other records
- Switched out deprecated mongoose mpromises library for native nodejs one

## [1.0.4] - 2017-04-21
### Added
- Index on runs.createdAt for use when expiring old runs

### Changed

## [1.0.3] - 2017-04-07
### Added
- Notification plugin model.  This allows you to create your own notification plugins to send job failure / recovery messages to your monitoring platform of choice.

### Changed
- Mandrill notification moved to plugin model.  The Mandrill plugin is included by default and should not require any config changes.

## [1.0.0] - 2015-11-08
### Added
- Option to specify number of failures before an alert is sent
- Confirmation before deleting a job in the web ui
- cli option to backup and restore jobs from a json file

### Changed
- Angular material table library updated

## [1.0.0] - 2016-03-24
### Added
- Initial release candidate