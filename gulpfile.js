const gulp = require('gulp')
const babel = require('gulp-babel')
const cache = require('gulp-cached')
const chmod = require('gulp-chmod')
const sass = require('gulp-sass')

const paths = {
  bin: 'bin/*',
  assets: {
    scss: 'assets/*.scss',
    js: 'assets/*.js',
    vectors: 'assets/vectors/*'
  }
}

gulp.task('bin', () => {
  return gulp.src(paths.bin)
  .pipe(cache('bin'))
  .pipe(babel())
  .pipe(chmod(755))
  .pipe(gulp.dest('dist'))
})

gulp.task('assets-js', () => {
  return gulp.src(paths.assets.js)
  .pipe(cache('assets-js'))
  .pipe(babel())
  .pipe(gulp.dest('dist/assets'))
})

gulp.task('assets-scss', () => {
  return gulp.src(paths.assets.scss)
  .pipe(cache('assets-scss'))
  .pipe(sass({
    outputStyle: 'compressed'
  }).on('error', sass.logError))
  .pipe(gulp.dest('dist/assets'))
})

gulp.task('watch', () => {
  gulp.watch(paths.bin, ['bin'])

  gulp.watch(paths.assets.scss, ['assets-scss'])
  gulp.watch(paths.assets.js, ['assets-js'])
})

gulp.task('build', ['bin', 'assets-js', 'assets-scss'])
gulp.task('default', ['watch', 'build'])
