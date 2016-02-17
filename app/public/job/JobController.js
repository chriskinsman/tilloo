angular.module('tillooApp.job')
    .controller('JobController', ['jobService', '$scope', '$routeParams', '$timeout', function (jobService, $scope, $routeParams, $timeout) {
        'use strict';

        $scope.selected = [];

        $scope.query = {
            order: '-startedAt'
        };

        function getRuns() {
            $scope.promise = jobService.getRuns($routeParams.jobId);
            $scope.promise.then(success);
        }

        function getJob() {
            jobService.getJob($routeParams.jobId).then(function(result) {
                $timeout(function() {
                    $scope.job = result.data;
                });
            });
        }

        function success(runs) {
            $scope.runs = runs.data;
        }

        function updateStatus(status) {
            // A status update for this job
            if(status.jobId && status.jobId === $routeParams.jobId && status.runId) {
                console.log(status);
                jobService.getRun(status.runId).then(function(result) {
                    $timeout(function() {
                        var runIndex = _.findIndex($scope.runs, function(run) { return run._id == status.runId;});
                        if(runIndex!==-1) {
                            $scope.runs[runIndex] = result.data;
                        }
                        else {
                            $scope.runs.push(result.data);
                        }
                    });
                });
            }
        }

        function updateJob(jobMessage) {
            // Only update the job if for the job we are displaying
            if(jobMessage.jobId === $routeParams.jobId) {
                getJob();
            }
        }

        var socket = io('http://localhost:7700');
        socket.on('status', updateStatus);
        socket.on('jobchange', updateJob);

        // Clear event handler when leaving
        $scope.$on('$destroy', function() {
            socket.removeListener('status', updateStatus);
            socket.removeListener('jobchange', updateJob);
        });

        getJob();
        getRuns();
    }]);