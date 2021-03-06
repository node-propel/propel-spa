var PackageTask = {
  inject: ['gulp', 'plugins', 'pkg'],
  load: function(gulp, plugins, pkg) {
    gulp.task('package', function(cb) {
      return gulp.src("build/**/*")
        .pipe(plugins.tar([pkg.name, '-', pkg.version, '.tar'].join('')))
        .pipe(plugins.gzip())
        .pipe(gulp.dest('packages'));
    });
  }
};

module.exports = PackageTask;
