import gulp from 'gulp'
import babel from 'gulp-babel'
import cache from 'gulp-cached'
import sass from 'gulp-sass'
import chmod from 'gulp-chmod'

const paths = {
  bin: 'bin/*',
  styles: 'assets/*.scss'
}

const sassConfig = {
  outputStyle: 'compressed'
}

gulp.task('bin', () => gulp.src(paths.bin)
  .pipe(cache('bin'))
  .pipe(babel())
  .pipe(chmod(0o755))
  .pipe(gulp.dest('dist/bin')))

gulp.task('scss', () => gulp.src(paths.styles)
  .pipe(sass(sassConfig).on('error', sass.logError))
  .pipe(gulp.dest('dist/assets')))

gulp.task('watch', () => {
  gulp.watch(paths.bin, ['bin'])
  gulp.watch(paths.styles, ['scss'])
})

gulp.task('build', ['bin', 'scss'])
gulp.task('default', ['watch', 'build'])
