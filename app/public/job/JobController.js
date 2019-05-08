angular.module('tillooApp.job')
    .controller('JobController', ['jobService', '$scope', '$routeParams', '$timeout', '$rootScope', function (jobService, $scope, $routeParams, $timeout, $rootScope) {
        'use strict';

        //$rootScope.breadcrumbs = [$routeParams.jobId];
        $rootScope.showSearch = false;
        $scope.selected = [];

        $scope.query = {
            order: '-startedAt',
            page: 1,
            pageSize: 20
        };

        $scope.onPaginate = function(page, limit) {
            $scope.query.page = page;
            $scope.query.pageSize = limit;

            getRuns($scope.query);
        };

        function getRuns(query) {
            jobService.getRuns($routeParams.jobId, query.page, query.pageSize).then(function(result) {
                $scope.runs = result.data.runs;
                $scope.query.runCount = result.data.count;
            });

        }

        function getJob() {
            jobService.getJob($routeParams.jobId).then(function(result) {
                $timeout(function() {
                    $scope.job = result.data;
                    $scope.job.displayArgs = $scope.job.args.join(' ');
                    $rootScope.breadcrumbs = [$scope.job.name];
                });
            });
        }

        function updateStatus(status) {
            // A status update for this job
            if(status.jobId && status.jobId === $routeParams.jobId && status.runId) {
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
            updateJob(status);
        }

        function updateJob(jobMessage) {
            // Only update the job if for the job we are displaying
            if(jobMessage.jobId === $routeParams.jobId) {
                getJob();
            }
        }

        $scope.runJob = function runJob(jobId) {
            jobService.runJob(jobId);
        };

        $scope.stopRun = function stopRun(runId) {
            jobService.stopRun(runId);
        };

        jobService.getConfig().then(function(result) {
            var socket = io();
            socket.on('status', updateStatus);
            socket.on('jobchange', updateJob);

            // Clear event handler when leaving
            $scope.$on('$destroy', function() {
                socket.removeListener('status', updateStatus);
                socket.removeListener('jobchange', updateJob);
            });
        });

        getJob();
        getRuns($scope.query);
    }]);
