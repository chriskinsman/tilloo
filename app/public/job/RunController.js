angular.module('tillooApp.job')
    .controller('RunController', ['jobService', '$scope', '$routeParams', '$timeout', function (jobService, $scope, $routeParams, $timeout) {
        'use strict';

        $scope.runId = $routeParams.runId;

        $scope.query = {
            order: 'name'
        };

        function getRunOutput() {
            $scope.promise = jobService.getLogs($routeParams.runId);
            $scope.promise.then(function(result) {
                $scope.loglines = result.data;
            });
        }

        function addToLog(message) {
            if(message.runId === $scope.runId) {
                $timeout(function () {
                    $scope.loglines.push({output: message.output});
                });
            }
        }

        var socket = io('http://localhost:7700');
        socket.on('log', addToLog);

        // Clear event handler when leaving
        $scope.$on('$destroy', function() {
            socket.removeListener('log', addToLog);
        });


        getRunOutput($scope.query);
    }]);