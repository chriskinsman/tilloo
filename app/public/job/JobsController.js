angular.module('tillooApp.job')
    .controller('JobsController', ['jobService', '$scope', '$timeout', '$mdDialog', '$rootScope', function (jobService, $scope, $timeout, $mdDialog, $rootScope) {
        'use strict';

        $rootScope.breadcrumbs = ['Jobs'];

        $scope.selected = [];

        $scope.query = {
            order: 'name'
        };

        function getJobs() {
            $scope.promise = jobService.getJobs();
            $scope.promise.then(function(jobs) {
                $scope.jobs = jobs.data;
            });
        }

        function updateStatus(status) {
            if(status.jobId) {
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

        $scope.deleteJob = function deleteJob(jobId,jobName, event) {
            var confirm = $mdDialog.confirm()
                .title('Delete job?')
                .textContent('Are you sure you want to delete ' + jobName + '?')
                .ariaLabel('Delete job confirmation')
                .targetEvent(event)
                .ok('Delete Job')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {                  
                jobService.deleteJob(jobId);
            }, function() {
                // User canceled, do nothing
            });
              
        };

        $scope.runJob = function runJob(jobId) {
            jobService.runJob(jobId);
        };

        $scope.addJob = function addJob() {
            $mdDialog.show({
                controller: AddController,
                templateUrl: '/public/job/editjob.tmpl.html',
                parent: angular.element(document.body)
            });
        };

        $scope.editJob = function editJob(jobId) {
            $mdDialog.show({
                controller: EditController,
                templateUrl: '/public/job/editjob.tmpl.html',
                parent: angular.element(document.body),
                locals: {
                    jobId: jobId
                }
            });
        };

        function AddController($scope, $mdDialog) {
            $scope.title = 'Add Job';
            $scope.OkTitle = 'Add';
            $scope.job = {
                schedule: '0 0 */1 * * *',
                queueName: 'tilloo.worker',
                args: [],
                enabled: true,
                mutex: true,
                failuresBeforeAlert: 1,
                timeout: 0
            };

            $scope.cancel = function cancel() {
                $mdDialog.cancel();
            };

            $scope.save = function save() {
                jobService.createJob($scope.job);
                $mdDialog.hide();
            };
        }

        function EditController($scope, $mdDialog, jobId) {
            $scope.title = 'Edit Job';
            $scope.OkTitle = 'Update';
            jobService.getJob(jobId).then(function(result) {
                $scope.job = result.data;
            });

            $scope.cancel = function cancel() {
                $mdDialog.cancel();
            };

            $scope.save = function save() {
                jobService.updateJob(jobId, $scope.job);
                $mdDialog.hide();
            };
        }

        jobService.getConfig().then(function(result) {
            var socket = io('http://' + result.data.scheduler.host + ':' + result.data.scheduler.port);
            socket.on('status', updateStatus);
            socket.on('jobchange', updateJob);

            // Clear event handler when leaving
            $scope.$on('$destroy', function () {
                socket.removeListener('status', updateStatus);
                socket.removeListener('jobchange', updateJob);
            });
        });

        getJobs();
    }]);
