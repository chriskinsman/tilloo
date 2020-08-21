
angular.module('tillooApp.job')
    .factory('jobService', ['$http', '$location', '$q', function ($http, $location, $q) {
        'use strict';

        var JobService = {};

        JobService.getConfig = function getConfig() {
            var deferred = $q.defer();
            $http.get('/api/config', { cache: true }).then(function (result) {
                deferred.resolve(result);
            });

            return deferred.promise;
        };

        JobService.getJobs = function getJobs() {
            return JobService._remoteCall('job', {});
        };

        JobService.getJob = function getJob(jobId) {
            return JobService._remoteCall('job/' + jobId, {});
        };

        JobService.getJobByRunId = function getJobByRunId(runId) {
            return JobService._remoteCall('job/run/' + runId, {});
        };


        JobService.getRuns = function getRuns(jobId, page, pageSize, sort) {
            return JobService._remoteCall('job/' + jobId + '/runs', { page: page, pageSize: pageSize, sort: sort });
        };

        JobService.getRunsCount = function getRunsCount(jobId) {
            return JobService._remoteCall('job/' + jobId + '/runs/count', {});
        };

        JobService.getRun = function getRun(runId) {
            return JobService._remoteCall('run/' + runId, {});
        };

        JobService.getLogs = function getLogs(runId) {
            return JobService._remoteCall('run/' + runId + '/output', {});
        };

        JobService.stopRun = function stopRun(runId) {
            return JobService._remoteCall('run/' + runId + '/stop', null, { post: true });
        };

        JobService.runJob = function runJob(jobId) {
            return JobService._remoteCall('job/' + jobId + '/run', null, { post: true });
        };

        JobService.deleteJob = function deleteJob(jobId) {
            return JobService._remoteCall('job/' + jobId + '/delete', null, { post: true });
        };

        JobService.createJob = function createJob(jobDef) {
            return JobService._remoteCall('job/create', { jobDef: jobDef }, { post: true });
        };

        JobService.updateJob = function updateJob(jobId, jobDef) {
            return JobService._remoteCall('job/' + jobId + '/update', { jobDef: jobDef }, { post: true });
        };

        JobService._remoteCall = function (path, params, options) {
            options = options || {}; // eslint-disable-line no-param-reassign

            if (options.post === true) {
                return $http.post('/api/' + path, params);
            }

            return $http.get('/api/' + path, { params: params });
        };

        return JobService;

    }]);
