# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added

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