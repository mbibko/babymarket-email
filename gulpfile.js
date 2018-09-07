const fs = require('fs');
const del = require('del');
var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var nunjucksRender = require('gulp-nunjucks-render');
var inlineCss = require('gulp-inline-css');
var inlineSource = require('gulp-inline-source');
var vinylFtp = require('vinyl-ftp');
var plumber = require('gulp-plumber');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var sendmail = require('gulp-mailgun');
var jsbeautifier = require('gulp-jsbeautifier');
var htmllint = require('gulp-htmllint');

/** FTP Configuration **/
var ftp = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PWD,
    host: '188.225.80.86',
    port: 21,
    localFilesGlob: ['./build/**/*.*'],
    baseFolder: './build/',
    remoteFolder: '/www/html.xx28.ru/vsekroham-mail'
}

gulp.task('watch', () => {
    gulp.watch(['app/*.*', 'app/images/**/*.{png,jpg,jpeg,gif,svg}', '!app/main.css'], gulp.series(copyFiles, 'reload'));
    gulp.watch('app/scss/**/*.scss', gulp.series('sass', 'html', 'reload'));
    gulp.watch('app/html/**/*.html', gulp.series('html', copyFiles, 'reload'));
});

gulp.task('reload', function(cb) {
    browserSync.reload()
    cb();
});

function clean() {
    return del(['./build']);
}

gulp.task('html', () => {
    return gulp.src('app/html/*.html')
        .pipe(plumber({
            errorHandler: function(err) {
                process.stderr.write("\007");
                console.log(err);
            }
        }))
        .pipe(nunjucksRender({
            path: ['app/html/layouts']
        }))
        .pipe(inlineSource())
        .pipe(inlineCss({
            preserveMediaQueries: true
        }))
        .pipe(gulp.dest('build'))
});

gulp.task('sass', () => {
    return gulp.src('app/scss/*.scss')
        .pipe(plumber({
            errorHandler: function(err) {
                process.stderr.write("\007");
                console.log(err);
            }
        }))
        .pipe(sass({
            outputStyle: 'compressed', // nested, compressed
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('serve', () => {
    browserSync.init({
        notify: false,
        open: false,
        server: {
            baseDir: ['build']
        }
    });
});

function replaceString(folder, string, replacer) {
    fs.readdir(folder, (err, files) => {
        var files = files.filter(el => /\.html$/.test(el))
        files.forEach(file => {
            fs.readFile(folder + file, 'utf8', (err, data) => {
                if (err) {
                    return console.log(err);
                }
                var re = new RegExp(string, "g");
                var result = data.replace(re, replacer);

                fs.writeFile(folder + file, result, 'utf8', function(err) {
                    if (err) return console.log(err);
                });
            });
            // console.log(file);
        });
    });
}

gulp.task('html-pretty', () => {
    return gulp.src('build/*.html')
        .pipe(jsbeautifier({
            indent_inner_html: true,
            preserve_newlines: false,
            max_preserve_newlines: 0,
            extra_liners: [],
            unformatted: [],
            brace_style: 'expand',
            indent_char: ' ',
            indent_size: 4
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('htmllint', () => {
    return gulp.src('./build/*.html')
            .pipe(htmllint({
                rules: {
                    "line-end-style": false,
                    "attr-bans": [],
                    "class-style": 'none',
                    "img-req-alt": false,
                    "tag-bans": []
                }
            }, htmllintReporter));
});

function copyFiles(cb) {
    return gulp.src(['app/*.*', 'app/images/**/*.{png,jpg,jpeg,gif,svg}', '!app/main.css'], {base: 'app'})
        .pipe(gulp.dest('build'));
}

function replaceFiles(cb) {
    replaceString('./build/', 'images/', 'http://html.xx28.ru/vsekroham-mail/images/');
    cb();
}

gulp.task('production', gulp.series(clean, 'sass', 'html', 'html-pretty', 'htmllint', copyFiles, replaceFiles));

function htmllintReporter(filepath, issues) {
    if (issues.length > 0) {
        issues.forEach(function (issue) {
            console.log('[gulp-htmllint] '+ filepath + ' ['+ issue.line + ', ' + issue.column +']' + ' (' + issue.code + ') ' + issue.msg);
        });
        process.exitCode = 1;
    }
}

gulp.task('sendmail', () => {
    gulp.src(['build/*.html']) // Modify this to select the HTML file(s)
        .pipe(sendmail({
            key: 'key-c9370f6109ccb5fa6223fd4f673e36c4', // Enter your Mailgun API key here
            sender: 'postmaster@sandboxa7c0607c0d9d40abb5c50ca20018e3b1.mailgun.org',
            recipient: 'mbibko@gmail.com',
            // recipient: 'alex@silentcode.org',
            // recipient: 'frolovean@gmail.com',
            subject: 'vsekroham mail'
        }));
});

/**
 * Deploy task.
 * Copies the new files to the server
 *
 * Usage: `FTP_USER=someuser FTP_PWD=somepwd gulp ftp-deploy`
 */

gulp.task('ftp-deploy', () => {
     var conn = vinylFtp.create({
         host: ftp.host,
         port: ftp.port,
         user: ftp.user,
         password: ftp.password,
         parallel: 5,
         log: null
     });

     return gulp.src(ftp.localFilesGlob, { base: ftp.baseFolder, buffer: false })
         .pipe(conn.newer(ftp.remoteFolder)) // only upload newer files 
         .pipe(conn.dest(ftp.remoteFolder))
});

gulp.task('ftp-deploy:production', gulp.series('production', 'ftp-deploy'));

gulp.task('default', gulp.parallel('watch', 'serve'));
