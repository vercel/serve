const gulp = require('gulp')
const babel = require('gulp-babel')
const cache = require('gulp-cached')
const chmod = require('gulp-chmod')
const sass = require('gulp-sass')

const paths = {
  bin: 'bin/*',
  styles: 'assets/*.scss'
}

gulp.task('bin', () => {
  return gulp.src(paths.bin)
  .pipe(cache('bin'))
  .pipe(babel())
  .pipe(chmod(755))
  .pipe(gulp.dest('dist/bin'))
})

gulp.task('scss', () => {
  return gulp.src(paths.styles)
  .pipe(sass({
    outputStyle: 'compressed'
  }).on('error', sass.logError))
  .pipe(gulp.dest('dist/assets'))
})

gulp.task('watch', () => {
  gulp.watch(paths.bin, ['bin'])
  gulp.watch(paths.styles, ['scss'])
})

gulp.task('build', ['bin', 'scss'])
gulp.task('default', ['watch', 'build'])
