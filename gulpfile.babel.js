/**
 * Created by rs on 02/04/16.
 */
'use strict';

import gulp from 'gulp';
import babel from 'gulp-babel'
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import paths from 'path'
import nodemon from 'gulp-nodemon'

const dirs = {
	src: 'src',
	dest: 'build'
};

gulp.task('build', () => {
	return buildServer();
});

const buildServer = () => {
	return gulp.src(dirs.src + '/server.js')
		.pipe(sourcemaps.write('.'))
		.pipe(babel({presets: ['es2015']}))
		.pipe(gulp.dest(dirs.dest));
};

gulp.task('restart', () => {
	gulp.watch([dirs.src + '/server.js'], () => {
		buildServer();
	});
});

gulp.task('nodemon-start', function () {
	nodemon({
		script: 'build/server.js',
		ext: 'js html',
		env: { 'NODE_ENV': 'development' },
		debug: true
	})
});

gulp.task('default', ['build', 'nodemon-start', 'restart']);