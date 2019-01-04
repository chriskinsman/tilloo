

var tillooApp = angular.module('tillooApp', ['tillooApp.job', 'ngRoute', 'ngMaterial', 'md.data.table']) // eslint-disable-line no-unused-vars
    .config(['$routeProvider', '$locationProvider', '$httpProvider', '$sceDelegateProvider', '$mdThemingProvider', '$mdIconProvider', function ($routeProvider, $locationProvider, $httpProvider, $sceDelegateProvider, $mdThemingProvider, $mdIconProvider) {
        'use strict';
        $routeProvider.
            when('/', { templateUrl: '/public/job/jobs.html', controller: 'JobsController'}).
            when('/job/:jobId', {templateUrl: '/public/job/job.html', controller: 'JobController'}).
            when('/run/:runId', {templateUrl: '/public/job/run.html', controller: 'RunController'}).
            otherwise({ redirectTo: '/' });

        $mdIconProvider
            .defaultIconSet('./assets/svg/avatars.svg', 128)
            .icon('menu'       , './assets/svg/menu.svg'        , 24)
            .icon('share'      , './assets/svg/share.svg'       , 24)
            .icon('google_plus', './assets/svg/google_plus.svg' , 512)
            .icon('hangouts'   , './assets/svg/hangouts.svg'    , 512)
            .icon('twitter'    , './assets/svg/twitter.svg'     , 512)
            .icon('phone'      , './assets/svg/phone.svg'       , 512);

        $mdThemingProvider
            .theme('default')
            .primaryPalette('light-blue');

        var customAccent = {
            '50': '#ccefef',
            '100': '#b9e8e9',
            '200': '#a5e2e3',
            '300': '#92dcdd',
            '400': '#7ed5d7',
            '500': '#6BCFD1',
            '600': '#58c9cb',
            '700': '#44c2c5',
            '800': '#39b4b7',
            '900': '#33a1a3',
            'A100': '#e0f5f5',
            'A200': '#f3fbfb',
            'A400': '#ffffff',
            'A700': '#2d8e90'
        };

        $mdThemingProvider
            .definePalette('customAccent', customAccent);

        $mdThemingProvider.theme('default')
            .accentPalette('customAccent');

        $locationProvider.html5Mode(true);
        $httpProvider.defaults.useXDomain = true;

        // allow external embeds from whitelisted hosts
        $sceDelegateProvider.resourceUrlWhitelist([
            // Allow same origin resource loads.
            'self'
        ]);
    }
    ]);
