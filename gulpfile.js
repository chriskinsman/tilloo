// Include gulp
const gulp = require('gulp');

// Include Our Plugins
const eslint = require('gulp-eslint');

const srcDir = './app';

gulp.task('lint', gulp.series(lintClient, lintServer));

// Lint Task
function lintClient() {
    return gulp.src([srcDir + '/public/**/*.js', '!' + srcDir + '/public/assets/libs/**/*.js', '!' + srcDir + '/public/node_modules/**/*.js'])
        .pipe(eslint({ useEslintrc: true }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

// Lint Task
function lintServer() {
    return gulp.src(['./**/*.js', '!' + srcDir + '/public/node_modules/**/*.js', '!' + srcDir + '/public/**/*.js', '!./node_modules/**', '!./ve/**/*'])
        .pipe(eslint({ useEslintrc: true }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}
