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
  .pipe(gulp.dest('dist/bin'))
})

gulp.task('client', () => {
  return gulp.src(paths.assets.js)
  .pipe(cache('client'))
  .pipe(babel())
  .pipe(gulp.dest('dist/assets'))
})

gulp.task('scss', () => {
  return gulp.src(paths.assets.scss)
  .pipe(sass({
    outputStyle: 'compressed'
  }).on('error', sass.logError))
  .pipe(gulp.dest('dist/assets'))
})

gulp.task('watch', () => {
  gulp.watch(paths.bin, ['bin'])

  gulp.watch(paths.assets.scss, ['scss'])
  gulp.watch(paths.assets.js, ['client'])
})

gulp.task('build', ['bin', 'client', 'scss'])
gulp.task('default', ['watch', 'build'])
