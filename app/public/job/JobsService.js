
angular.module('tillooApp.job')
    .factory('jobService', ['$http', function($http) {
        'use strict';

        var JobService = {};

        JobService.getJobs = function getJobs() {
            return JobService._remoteCall('job', {});
        };

        JobService.getJob = function getJob(jobId) {
            return JobService._remoteCall('job/' + jobId, {})
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


        ////AudienceService.get = function(audienceId)
        ////{
        ////    return AudienceService._remoteCall("", {audienceId: audienceId});
        ////};
        //
        //JobService.create = function(name, files){
        //    return JobService._remoteCall("/create/", {name: name, files: files}, {post:true});
        //};
        //
        //JobService.appendFiles = function(audienceId, files){
        //    return JobService._remoteCall("/append/", {audienceId: audienceId, files: files}, {post:true});
        //};
        //
        //JobService.update = function(name, audienceId,type){
        //    return JobService._remoteCall("/update/", {name: name, audienceId: audienceId, type:type}, {post:true});
        //};
        //
        //JobService.delete = function(audienceId){
        //    return JobService._remoteCall("/delete/", {audienceId: audienceId}, {post:true});
        //};
        //
        //JobService.developerDebug = function(apiKey) {
        //    return JobService._remoteCall("/developerDebug/", {apiKey: apiKey}, {});
        //};
        //
        //JobService.audienceTagDebug = function(audienceKey) {
        //    return JobService._remoteCall("/audienceTagDebug/", {audienceKey: audienceKey}, {});
        //};


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
