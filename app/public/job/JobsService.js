
angular.module('tillooApp.job')
    .factory('jobService', ['$http', function($http) {
        'use strict';

        var JobService = {};

        JobService.list = function list() {
            return JobService._remoteCall('', {});
        };

        JobService.runDetailList = function runDetailList(jobId) {
            return JobService._remoteCall('/detail', {jobId: jobId});
        };

        JobService.runOutput = function runOutput(runId) {
            return JobService._remoteCall('/run', {runId: runId});
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
                return $http.post("/api/job" + path, params);
            } else {
                return $http.get("/api/job" + path, {params:params});
            }
        };

        return JobService;

    }]);
