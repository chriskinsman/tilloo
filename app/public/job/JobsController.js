'use strict';

angular.module('tillooApp.job')
    .controller('JobsController', ['jobService', '$scope', function (jobService, $scope) {
    'use strict';

    $scope.selected = [];

    $scope.query = {
        order: 'name'
    };

    function getJobs() {
        $scope.promise = jobService.list();
        $scope.promise.then(success);
    }

    function success(jobs) {
        $scope.jobs = jobs.data;
    }

    //$scope.onReorder = function (order) {
    //    getJobs(angular.extend({}, $scope.query, {order: order}));
    //};

    getJobs();
}]);