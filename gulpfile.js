var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var nunjucksRender = require('gulp-nunjucks-render');
var spritesmith = require('gulp.spritesmith');
var inlineCss = require('gulp-inline-css');
var path = require('path');
var translit = require('translitit-cyrillic-russian-to-latin');
var inlineSource = require('gulp-inline-source');
var ftp = require( 'vinyl-ftp' );
// var cssUrlVersion = require('gulp-css-urlversion');

var spriteFolder = 'sprite-images';

/** Configuration **/
var user = 'maks';
var password = '3H8i5H5c';  
var host = '188.225.80.86';  
var port = 21;  
var localFilesGlob = ['./app/images/**/*', './app/*.html'];
var baseFolder = './app/';
var remoteFolder = '/www/html.xx28.ru/vsekroham/e-mail';

gulp.task('html-watcher', ['html'], function() {
    browserSync.reload();
});

function getDataForFile(file) {
    return require('./app/html/data.json');
}

gulp.task('html', function() {
    return gulp.src('app/html/*.html')
        .pipe($.plumber({
            errorHandler: $.notify.onError("<%= error.message %>")
        }))
        .pipe($.data(getDataForFile))
        .pipe(nunjucksRender({
            path: ['app/html/layouts'] // String or Array 
        }))
        .pipe(inlineSource())
        .pipe(inlineCss({
            preserveMediaQueries: true
        }))
        .pipe($.replace('src="images/', 'src="http://html.xx28.ru/vsekroham/e-mail/images/'))
        .pipe($.replace('url(images/', 'url(http://html.xx28.ru/vsekroham/e-mail/images/'))
        // .pipe($.replace('<script src="https://code.jquery.com/jquery-1.9.1.min.js"></script>', ''))
        // .pipe($.replace('<script src="dinamic-links.js"></script>', ''))
        // .pipe($.htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('app'));
});

gulp.task('watch', function() {
    gulp.watch([
        'app/css/**/*.css',
        '!app/css/main.css',
        'app/js/**/*.js',
        'app/!images/' + spriteFolder + '/**/*.*',
        'app/images/**/*.{png,jpg,jpeg,gif,svg}',
        'app/fonts/**/*.*'
    ], {
        interval: 800
    }).on('change', reload);

    gulp.watch('app/scss/**/*.scss', {
        interval: 300
    }, ['sass']);

    gulp.watch('app/scss/media.scss', {
        interval: 300
    }, ['media']);

    gulp.watch(['app/images/' + spriteFolder + '/*.png', 'app/images/' + spriteFolder + '/**/*.png'], {
        interval: 300
    }, ['sprites']);

    gulp.watch(['app/html/*.html', 'app/html/**/*.html'], ['html-watcher']);
    gulp.watch('app/main.css', ['html-watcher']);
    gulp.watch('app/css/media.css', ['html-watcher']);
});

gulp.task('sass', function() {
    return gulp.src('app/scss/main.scss')
        .pipe($.sourcemaps.init())
        .pipe($.plumber({
            errorHandler: $.notify.onError("<%= error.message %>")
        }))
        .pipe($.sass({
            outputStyle: 'compressed', // libsass doesn't support expanded yet
            // includePaths: ['bower_components/bootstrap-sass/assets/stylesheets/'],
        }))
        // .pipe(cssUrlVersion({baseDir: 'app/css'}))
        .pipe($.postcss([
            require('autoprefixer-core')({
                browsers: ['last 2 versions', 'ie >= 9', 'and_chr >= 2.3']
            })
        ]))
        // .pipe($.csso())
        .pipe($.sourcemaps.write('./maps', {
            includeContent: false,
            sourceRoot: 'app/scss'
        }))
        .pipe(gulp.dest('app'))
        .pipe(browserSync.stream({ match: '**/*.css' }));
});

gulp.task('media', function() {
    return gulp.src('app/scss/media.scss')
        // .pipe($.sourcemaps.init())
        .pipe($.plumber({
            errorHandler: $.notify.onError("<%= error.message %>")
        }))
        .pipe($.sass({
            outputStyle: 'compressed', // libsass doesn't support expanded yet
        }))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.stream({ match: '**/*.css' }));
});


gulp.task('sprites', function() {
    // Generate our spritesheet
    var spriteData = gulp.src('app/images/' + spriteFolder + '/**/*.png')
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: 'sprite.scss',
            imgPath: '../images/sprite.png',
            cssVarMap: function(sprite) {
                sprite.name = 'sprite-' + sprite.name;
            },
            algorithm: "top-down",
            algorithmOpts: { sort: false },
            padding: 10
        }));

    spriteData.img
        // .pipe(imagemin())
        .pipe(gulp.dest('app/images'));

    spriteData.css
        // .pipe(csso())
        .pipe(gulp.dest('app/scss/utilities'));
});

gulp.task('fonts', function() {
    return gulp.src('bower_components/bootstrap-sass/assets/fonts/**/*')
        .pipe(gulp.dest('app/fonts'));
});

gulp.task('serve', ['sass', 'fonts'], function() {
    browserSync.init({
        notify: false,
        open: false,
        server: {
            baseDir: ['app']
        }
    });
    gulp.start(['watch']);
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
gulp.task('sendmail', function () {
  gulp.src(['app/*.html']) // Modify this to select the HTML file(s)
  .pipe(sendmail({
    key: 'key-c9370f6109ccb5fa6223fd4f673e36c4', // Enter your Mailgun API key here
    sender: 'postmaster@sandboxa7c0607c0d9d40abb5c50ca20018e3b1.mailgun.org',
    recipient: 'mbibko@gmail.com',
    // recipient: 'alex@silentcode.org',
    // recipient: 'frolovean@gmail.com',
    subject: 'vsekroham mail'
  }));
});

gulp.task('inlinecss', function() {
    console.log('inlinecss start');
    return gulp.src('app/*.html')
        .pipe(inlineCss({
            preserveMediaQueries: true
        }))
        .pipe(gulp.dest('app/'));
});

// helper function to build an FTP connection based on our configuration
function getFtpConnection() {  
    return ftp.create({
        host: host,
        port: port,
        user: user,
        password: password,
        parallel: 5,
        log: $.util.log
    });
}
/**
 * Deploy task.
 * Copies the new files to the server
 *
 * Usage: `FTP_USER=someuser FTP_PWD=somepwd gulp ftp-deploy`
 */
gulp.task('ftp-deploy', function() {

    var conn = getFtpConnection();

    return gulp.src(localFilesGlob, { base: baseFolder, buffer: false })
        .pipe( conn.newer( remoteFolder ) ) // only upload newer files 
        .pipe( conn.dest( remoteFolder ) )
    ;
});

gulp.task('default', ['serve']);
