
angular.module('tillooApp.job')
    .factory('jobService', ['$http', function($http) {
        'use strict';

        var JobService = {};

        JobService.getJobs = function getJobs() {
            return JobService._remoteCall('job', {});
        };

        JobService.getJob = function getJob(jobId) {
            return JobService._remoteCall('job/' + jobId, {});
        };

        JobService.getRuns = function getRuns(jobId, page, pageSize, sort) {
            return JobService._remoteCall('job/' + jobId + '/runs', {page: page, pageSize: pageSize, sort: sort});
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
            return JobService._remoteCall('run/' + runId + '/stop', null, {post: true});
        };

        JobService.runJob = function runJob(jobId) {
            return JobService._remoteCall('job/' + jobId + '/run', null, {post: true});
        };

        JobService.deleteJob = function deleteJob(jobId) {
            return JobService._remoteCall('job/' + jobId + '/delete', null, {post: true});
        };

        JobService.createJob = function addJob(jobDef) {
            return JobService._remoteCall('job/create', {jobDef: jobDef}, {post: true});
        };

        JobService._remoteCall = function(path, params, options)
        {
            options = options || {};

            if (options.post === true)
            {
                return $http.post("/api/" + path, params);
            } else {
                return $http.get("/api/" + path, {params:params});
            }
        };

        return JobService;

    }]);
