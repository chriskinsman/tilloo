angular.module('tillooApp.job')
    .controller('RunDetailController', ['jobService', '$scope', '$routeParams', function (jobService, $scope, $routeParams) {
        'use strict';

        $scope.selected = [];

        $scope.query = {
            order: 'name'
        };

        function getRunOutput() {
            $scope.promise = jobService.getLogs($routeParams.runId);
            $scope.promise.then(success);
        }

        function success(runs) {
            $scope.loglines = runs.data;
        }

        //$scope.onReorder = function (order) {
        //    getRunDetails(angular.extend({}, $scope.query, {order: order}));
        //};

        getRunOutput($scope.query);
    }]);