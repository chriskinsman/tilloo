// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');

// This stuff is for the jshint notifications
var map = require('map-stream');
var stylish = require('jshint-stylish');

var srcDir = "./app";

gulp.task('lint', ['lint-server', 'lint-client']);

// Lint Task
gulp.task('lint-client',[], function() {
    return gulp.src([srcDir + '/public/**/*.js', '!' + srcDir + '/public/assets/libs/**/*.js'])
        .pipe(jshint({browser:true, globals:{angular:false}}))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});

// Lint Task
gulp.task('lint-server',[], function() {
    return gulp.src(['./**/*.js', '!' + srcDir + '/bower_components/**/*.js', '!' + srcDir + '/public/**/*.js', '!./node_modules/**', '!./ve/**/*'])
        .pipe(jshint({node:true, globals: {}}))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});
