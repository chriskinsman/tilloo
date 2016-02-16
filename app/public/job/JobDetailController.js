angular.module('tillooApp.job')
    .controller('JobDetailController', ['jobService', '$scope', '$routeParams', function (jobService, $scope, $routeParams) {
        'use strict';

        $scope.selected = [];

        $scope.query = {
            order: 'name'
        };

        function getRunDetails() {
            $scope.promise = jobService.runDetailList($routeParams.jobId);
            $scope.promise.then(success);
        }

        function success(runs) {
            $scope.runs = runs.data;
        }

        //$scope.onReorder = function (order) {
        //    getRunDetails(angular.extend({}, $scope.query, {order: order}));
        //};

        getRunDetails($scope.query);
    }]);