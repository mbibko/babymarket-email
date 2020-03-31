var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var nunjucksRender = require('gulp-nunjucks-render');
var inlineCss = require('gulp-inline-css');
var path = require('path');
var inlineSource = require('gulp-inline-source');

function reload(cb) {
  browserSync.reload()
  cb()
}

gulp.task('watch', function () {
  gulp.watch([
    'app/css/**/*.css',
    '!app/css/main.css',
    'app/js/**/*.js',
    'app/images/**/*.{png,jpg,jpeg,gif,svg}',
    'app/fonts/**/*.*'
  ]).on('change', gulp.series(reload));

  gulp.watch('app/scss/**/*.scss', gulp.series('sass'));

  gulp.watch('app/scss/media.scss', gulp.series('media'));

  gulp.watch('app/html/**/*.html', gulp.series('html', reload));
  gulp.watch('app/main.css', gulp.series('html', reload));
  gulp.watch('app/css/media.css', gulp.series('html', reload));
});

gulp.task('html', function () {
  return gulp.src('app/html/*.html')
    .pipe($.plumber({
      errorHandler: $.notify.onError("<%= error.message %>")
    }))
    .pipe(nunjucksRender({
      path: ['app/html/layouts'] // String or Array
    }))
    .pipe(inlineSource())
    .pipe(inlineCss({
      preserveMediaQueries: true
    }))
    .pipe($.replace('src="images/', 'src="http://html.xx28.ru/vsekroham-mail/images/'))
    .pipe($.replace('url(images/', 'url(http://html.xx28.ru/vsekroham-mail/images/'))
    // .pipe($.replace('<script src="https://code.jquery.com/jquery-1.9.1.min.js"></script>', ''))
    // .pipe($.replace('<script src="dinamic-links.js"></script>', ''))
    // .pipe($.htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('build'));
});

gulp.task('sass', function () {
  return gulp.src('app/scss/main.scss')
    .pipe($.sourcemaps.init())
    .pipe($.plumber({
      errorHandler: $.notify.onError("<%= error.message %>")
    }))
    .pipe($.sass({
      outputStyle: 'compressed', // libsass doesn't support expanded yet
    }))
    .pipe($.sourcemaps.write('./maps', {
      includeContent: false,
      sourceRoot: 'app/scss'
    }))
    .pipe(gulp.dest('build'))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

gulp.task('media', function () {
  return gulp.src('app/scss/media.scss')
    // .pipe($.sourcemaps.init())
    .pipe($.plumber({
      errorHandler: $.notify.onError("<%= error.message %>")
    }))
    .pipe($.sass({
      outputStyle: 'compressed', // libsass doesn't support expanded yet
    }))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

gulp.task('fonts', function () {
  return gulp.src('bower_components/bootstrap-sass/assets/fonts/**/*')
    .pipe(gulp.dest('app/fonts'));
});

gulp.task('serve', cb => {
  browserSync.init({
    notify: false,
    open: false,
    server: {
      baseDir: ['build']
    }
  });
  cb()
});

var options = {
  user: 'api:key-c9370f6109ccb5fa6223fd4f673e36c4',
  url: 'https://api.mailgun.net/v3/sandboxa7c0607c0d9d40abb5c50ca20018e3b1.mailgun.org/messages',
  form: {
    from: 'Maxim <postmaster@sandboxa7c0607c0d9d40abb5c50ca20018e3b1.mailgun.org>',
    to: 'Maxim <mbibko@gmail.com>',
    subject: 'You have an new email',
    text: 'text version'
  }
};

sendmail = require('gulp-mailgun');
gulp.task('sendmail', cb => {
  gulp.src(['app/*.html']) // Modify this to select the HTML file(s)
    .pipe(sendmail({
      key: 'key-c9370f6109ccb5fa6223fd4f673e36c4', // Enter your Mailgun API key here
      sender: 'postmaster@sandboxa7c0607c0d9d40abb5c50ca20018e3b1.mailgun.org',
      recipient: 'mbibko@gmail.com',
      // recipient: 'alex@silentcode.org',
      // recipient: 'frolovean@gmail.com',
      subject: 'vsekroham mail'
    }));
  cb();
});

gulp.task('inlinecss', function () {
  console.log('inlinecss start');
  return gulp.src('app/*.html')
    .pipe(inlineCss({
      preserveMediaQueries: true
    }))
    .pipe(gulp.dest('app/'));
});

gulp.task('default', gulp.parallel('watch', 'serve'));
