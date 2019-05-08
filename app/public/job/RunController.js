angular.module('tillooApp.job')
    .controller('RunController', ['jobService', '$scope', '$routeParams', '$timeout', '$rootScope', function (jobService, $scope, $routeParams, $timeout, $rootScope) {
        'use strict';

        $scope.runId = $routeParams.runId;
        $scope.stopDisabled = true;

        $scope.query = {
            order: 'name'
        };

        $scope.stopRun = function stopRun() {
            jobService.stopRun($routeParams.runId);
        };

        function getRunOutput() {
            $scope.promise = jobService.getLogs($routeParams.runId);
            $scope.promise.then(function(result) {
                $scope.loglines = result.data;
            });
        }

        function getRun() {
            jobService.getRun($routeParams.runId).then(function(runResult) {
                $scope.run = runResult.data;
                $scope.stopDisabled = !(runResult.data.status === 'busy' || runResult.data.status === 'idle');
                if($rootScope.breadcrumbs) {
                    $rootScope.breadcrumbs.push(' > ' + $routeParams.runId);
                }
                else {
                    jobService.getJobByRunId($routeParams.runId).then(function(jobResult) {
                        $rootScope.breadcrumbs = [jobResult.data.name + ' - ' + jobResult.data._id, ' > ' + $routeParams.runId];
                    });
                }
            });
        }

        function addToLog(message) {
            if(message.runId === $scope.runId) {
                $timeout(function () {
                    $scope.loglines.push({output: message.output});
                });
            }
        }

        function buttonStatus(message) {
            if(message.runId === $scope.runId) {
                $timeout(function() {
                    $scope.run.status = message.status;
                    $scope.stopDisabled = !(message.status === 'busy' || message.status === 'idle');
                });
            }
        }

        jobService.getConfig().then(function(result) {
            var socket = io();

            socket.on('log', addToLog);
            socket.on('status', buttonStatus);


            // Clear event handler when leaving
            $scope.$on('$destroy', function () {
                socket.removeListener('log', addToLog);
                socket.removeListener('status', buttonStatus);
            });
        });

        getRunOutput($scope.query);
        getRun();
    }]);