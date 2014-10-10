'use strict';

var exec = require('child_process').exec;
var fs = require('fs');

var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
var indentString = require('indent-string');
var mergeStream = require('merge-stream');
var rimraf = require('rimraf');
var stylish = require('jshint-stylish');
var toCamelCase = require('to-camel-case');
var sourceHanSansUtf32MapJp = require('source-han-sans-utf32-map-jp');

var pkg = require('./package.json');
var bower = require('./bower.json');
var funName = toCamelCase(pkg.name);

var banner = [
  '/*!',
  ' * ' + pkg.name + ' | MIT (c) Shinnosuke Watanabe',
  ' * ' + pkg.homepage,
  '*/\n'
].join('\n');

var funWrapper = [
  'function <%= funName %>() {',
  '  \'use strict\';',
  '  return<%= indentString(contents, "  ") %>',
  '}'
].join('\n');

gulp.task('lint', function() {
  gulp.src(['*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter(stylish))
    .pipe($.jscs('.jscs.json'));
  gulp.src('*.json')
    .pipe($.jsonlint())
    .pipe($.jsonlint.reporter());
});

gulp.task('clean:json', rimraf.bind(null, pkg.name + '.json'));

gulp.task('build:json', ['clean:json'], function(cb) {
  var newSource = {};
  var source = sourceHanSansUtf32MapJp();

  Object.keys(source).forEach(function(utf32) {
    var codePoint = parseInt(utf32, 16);
    newSource[codePoint] = source[utf32];
  });

  var json = JSON.stringify(newSource, null, '  ') + '\n';
  fs.writeFile(pkg.name + '.json', json, cb);
});

gulp.task('clean:scripts', rimraf.bind(null, 'scripts'));

gulp.task('build:scripts', ['clean:scripts', 'build:json'], function() {
  var wrapData = {
    funName: funName,
    indentString: indentString
  };

  return mergeStream(
    gulp.src(pkg.name + '.json')
      .pipe($.wrap(funWrapper, wrapData))
      .pipe($.header(banner + '!function() {\n\n'))
      .pipe($.footer('\nwindow.' + funName + ' = ' + funName + ';\n}();\n'))
      .pipe($.rename(bower.main))
      .pipe(gulp.dest('')),
    gulp.src(pkg.name + '.json')
      .pipe($.wrap(funWrapper, wrapData))
      .pipe($.header(banner))
      .pipe($.footer('\nmodule.exports = ' + funName + ';\n'))
      .pipe($.rename(pkg.main))
      .pipe(gulp.dest(''))
  );
});

gulp.task('build', ['lint', 'build:scripts']);

gulp.task('test', ['build'], function(cb) {
  exec('node test.js', function(err, stderr, stdout) {
    console.log(stderr);
    console.log(stdout);
    cb(err);
  });
});

gulp.task('watch', function() {
  gulp.watch(['{,src/}*.js'], ['test']);
  gulp.watch(['*.json', '.jshintrc'], ['lint']);
});

gulp.task('default', ['test', 'watch']);
