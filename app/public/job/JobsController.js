angular.module('tillooApp.job')
    .controller('JobsController', ['jobService', '$scope', '$timeout', '$mdDialog', function (jobService, $scope, $timeout, $mdDialog) {
        'use strict';

        $scope.selected = [];

        $scope.query = {
            order: 'name'
        };

        function getJobs() {
            $scope.promise = jobService.getJobs();
            $scope.promise.then(success);
        }

        function success(jobs) {
            $scope.jobs = jobs.data;
        }

        function updateStatus(status) {
            if(status.jobId) {
                console.log(status);
                var job = _.find($scope.jobs, {_id: status.jobId});
                if(job) {
                    $timeout(function() {
                        job.lastStatus = status.status;
                        if(status.status==='busy') {
                            job.lastRanAt = new Date();
                        }
                    });
                }
            }
        }

        function updateJob(jobMessage) {
            jobService.getJob(jobMessage.jobId).then(function(result) {
                var jobIndex = _.findIndex($scope.jobs, function (item) { return item._id == jobMessage.jobId; });
                console.log(result);
                $timeout(function() {
                    if(jobIndex!==-1) {
                        if(result.data.deleted) {
                            $scope.jobs.splice(jobIndex, 1);
                        }
                        else {
                            $scope.jobs[jobIndex] = result.data;
                        }
                    }
                    else {
                        $scope.jobs.push(result.data);
                    }
                });
            });
        }

        $scope.deleteJob = function deleteJob(jobId) {
            jobService.deleteJob(jobId);
        };

        $scope.runJob = function runJob(jobId) {
            jobService.runJob(jobId);
        };

        $scope.addJob = function addJob() {
            $mdDialog.show({

            });
        };

        var socket = io('http://localhost:7700');
        socket.on('status', updateStatus);
        socket.on('jobchange', updateJob);

        // Clear event handler when leaving
        $scope.$on('$destroy', function() {
            socket.removeListener('status', updateStatus);
            socket.removeListener('jobchange', updateJob);
        });

        getJobs();
    }]);