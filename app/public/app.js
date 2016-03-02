

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
        .primaryPalette('light-blue');
        //.accentPalette('blue', {
        //    'default': '100'
        //});
    //
    //var customPrimary = {
    //    '50': '#79d4fd',
    //    '100': '#60ccfd',
    //    '200': '#47c4fd',
    //    '300': '#2ebcfc',
    //    '400': '#14b4fc',
    //    '500': '#03A9F4',
    //    '600': '#0398db',
    //    '700': '#0286c2',
    //    '800': '#0275a8',
    //    '900': '#02638f',
    //    'A100': '#92dcfe',
    //    'A200': '#ace4fe',
    //    'A400': '#c5ecfe',
    //    'A700': '#015276'
    //};
    //$mdThemingProvider
    //    .definePalette('customPrimary',
    //        customPrimary);
    //
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
        .definePalette('customAccent',
            customAccent);
    //
    //var customWarn = {
    //    '50': '#fce4d5',
    //    '100': '#fbd5bd',
    //    '200': '#f9c5a5',
    //    '300': '#f8b68d',
    //    '400': '#f6a675',
    //    '500': '#F5975D',
    //    '600': '#f48845',
    //    '700': '#f2782d',
    //    '800': '#f16915',
    //    '900': '#de5d0e',
    //    'A100': '#fef3ed',
    //    'A200': '#ffffff',
    //    'A400': '#ffffff',
    //    'A700': '#c6530c'
    //};
    //$mdThemingProvider
    //    .definePalette('customWarn',
    //        customWarn);
    //
    //var customBackground = {
    //    '50': '#ffffff',
    //    '100': '#ffffff',
    //    '200': '#ffffff',
    //    '300': '#ffffff',
    //    '400': '#ffffff',
    //    '500': '#F2F2F2',
    //    '600': '#e5e5e5',
    //    '700': '#d8d8d8',
    //    '800': '#cccccc',
    //    '900': '#bfbfbf',
    //    'A100': '#ffffff',
    //    'A200': '#ffffff',
    //    'A400': '#ffffff',
    //    'A700': '#b2b2b2'
    //};
    //$mdThemingProvider
    //    .definePalette('customBackground',
    //        customBackground);
    //
    $mdThemingProvider.theme('default')
//        .primaryPalette('customPrimary')
        .accentPalette('customAccent');
//        .warnPalette('customWarn')
//        .backgroundPalette('customBackground');

    $locationProvider.html5Mode(true);
    $httpProvider.defaults.useXDomain = true;

    // allow external embeds from whitelisted hosts
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self'
    ]);
}]);
