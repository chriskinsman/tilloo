

var tillooApp = angular.module("tillooApp", ['tillooApp.job', 'ngRoute', 'ngMaterial', 'md.data.table'])
.config(['$routeProvider', '$locationProvider', '$httpProvider', '$sceDelegateProvider', '$mdThemingProvider', '$mdIconProvider', function ($routeProvider, $locationProvider, $httpProvider, $sceDelegateProvider, $mdThemingProvider, $mdIconProvider) {
    'use strict';
    $routeProvider.
    when('/', { templateUrl: '/public/job/jobs.html', controller: 'JobsController'}).
    when('/job/:jobId', {templateUrl: '/public/job/job.html', controller: 'JobController'}).
    when('/run/:runId', {templateUrl: '/public/job/run.html', controller: 'RunController'}).
    otherwise({ redirectTo: '/' });

    $mdIconProvider
        .defaultIconSet("./assets/svg/avatars.svg", 128)
        .icon("menu"       , "./assets/svg/menu.svg"        , 24)
        .icon("share"      , "./assets/svg/share.svg"       , 24)
        .icon("google_plus", "./assets/svg/google_plus.svg" , 512)
        .icon("hangouts"   , "./assets/svg/hangouts.svg"    , 512)
        .icon("twitter"    , "./assets/svg/twitter.svg"     , 512)
        .icon("phone"      , "./assets/svg/phone.svg"       , 512);

    $mdThemingProvider.theme('default')
        .primaryPalette('light-blue')
        .accentPalette('light-blue', {
            'default': '100'
        });

    $locationProvider.html5Mode(true);
    $httpProvider.defaults.useXDomain = true;

    // allow external embeds from whitelisted hosts
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self'
    ]);
}]);
