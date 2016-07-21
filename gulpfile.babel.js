import gulp from 'gulp'
import babel from 'gulp-babel'
import cache from 'gulp-cached'
import chmod from 'gulp-chmod'
import sass from 'gulp-sass'

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
