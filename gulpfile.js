'use strict';

// Plugin variables

const autoprefixer = require('autoprefixer');
const del = require('del');
const flatten = require('gulp-flatten');
const gifsicle = require('imagemin-gifsicle');
const gulp = require('gulp');
const jpegtran = require('imagemin-jpegtran');
const mincss = require('gulp-csso');
const minimage = require('gulp-imagemin');
const minjs = require('gulp-terser');
const mozjpeg = require('imagemin-mozjpeg');
const plumber = require('gulp-plumber');
const pngquant = require('imagemin-pngquant');
const postcss = require('gulp-postcss');
const pug = require('gulp-pug');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sassglob = require('gulp-sass-glob');
const server = require('browser-sync').create();
const zopfli = require('imagemin-zopfli');

// Vinyl variables

const bitmapExts = '{gif,jpg,png}';
const fontExts = '{woff,woff2}';
const jsPaths = [
  './app/scripts/*.js',
  './app/vendors/*.js',
  './app/vendors_customized/*.js',
];

// Task functions

const minsvg = function mimimizeSvgImages() {
  return gulp
    .src('./spec/img-raw/*.svg')
    .pipe(
      minimage([
        minimage.svgo({
          plugins: [
            { addAttributesToSVGElement: false },
            { addClassesToSVGElement: false },
            { cleanupAttrs: false },
            { cleanupEnableBackground: true },
            { cleanupIDs: false },
            { cleanupListOfValues: true },
            { cleanupNumericValues: true },
            { collapseGroups: true },
            { convertColors: true },
            { convertPathData: true },
            { convertShapeToPath: false },
            { convertStyleToAttrs: false },
            { convertTransform: true },
            { inlineStyles: false },
            { mergePaths: true },
            { minifyStyles: false },
            { moveElemsAttrsToGroup: true },
            { moveGroupAttrsToElems: false },
            { prefixIds: false },
            { removeAttrs: true },
            { removeComments: true },
            { removeDesc: true },
            { removeDimensions: true },
            { removeDoctype: true },
            { removeEditorsNSData: true },
            { removeElementsByAttr: false },
            { removeEmptyAttrs: true },
            { removeEmptyContainers: true },
            { removeEmptyText: true },
            { removeHiddenElems: true },
            { removeMetadata: true },
            { removeNonInheritableGroupAttrs: true },
            { removeRasterimg: false },
            { removeScriptElement: true },
            { removeStyleElement: true },
            { removeTitle: true },
            { removeUnknownsAndDefaults: true },
            { removeUnusedNS: true },
            { removeUselessDefs: false },
            { removeUselessStrokeAndFill: true },
            { removeViewBox: false },
            { removeXMLNS: false },
            { removeXMLProcInst: true },
            { sortAttrs: false },
          ],
        }),
      ]),
    )
    .pipe(gulp.dest('./spec/img-output/'));
};

const minbitmap = function minimizeBitmapImages() {
  return gulp
    .src(`./spec/img-raw/*.${bitmapExts}`)
    .pipe(
      minimage([
        gifsicle(),
        jpegtran({ progressive: true }),
        mozjpeg({ quality: 90 }),
        pngquant({ speed: 1, quality: [0.8, 0.8] }),
        zopfli({ more: true }),
      ]),
    )
    .pipe(gulp.dest('./spec/img-output/'));
};

const cleanbuild = function deleteFormerBuildFolder() {
  return del('./dist/');
};

const copyvideo = function copyVideoFilesToBuildFolder() {
  return gulp.src([
    './app/global/video/*.mp4',
    './app/components/**/video/*.mp4',
  ])
    .pipe(flatten())
    .pipe(gulp.dest('./dist/video/'));
};

const copyfavicons = function copyFaviconsToBuildFolder() {
  return gulp.src('./app/global/favicons/*')
    .pipe(gulp.dest('./dist/favicons/'));
};

const copyfonts = function copyFontFilesToBuildFolder() {
  return gulp
    .src(`./app/global/fonts/*.${fontExts}`)
    .pipe(gulp.dest('./dist/fonts/'));
};

const copysvg = function copySvgImagesToBuildFolder() {
  return gulp.src([
    './app/global/svg/*.svg',
    './app/components/**/svg/*.svg',
  ])
    .pipe(flatten())
    .pipe(gulp.dest('./dist/img/'));
};

const copybitmaps = function copyBitmapImagesToBuildFolder() {
  return gulp.src([
    `./app/global/bitmaps/*.${bitmapExts}`,
    `./app/components/**/bitmaps/*.${bitmapExts}`,
  ])
    .pipe(flatten())
    .pipe(gulp.dest('./dist/img/'));
};

const scripts = function launchJsCompiler() {
  return gulp
    .src(jsPaths)
    .pipe(minjs())
    .pipe(gulp.dest('./dist/js/'));
};

const style = function launchCssCompiler() {
  return gulp
    .src('./app/base/main.scss')
    .pipe(plumber())
    .pipe(sassglob())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest('./dist/css/'))
    .pipe(mincss())
    .pipe(rename('main.min.css'))
    .pipe(gulp.dest('./dist/css/'))
    .pipe(server.stream());
};

const html = function launchHtmlCompiler() {
  return gulp
    .src('./app/pages/*.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest('./dist/'))
    .pipe(server.stream());
};

const reload = function reloadBrowserSync(done) {
  server.reload();
  done();
};

const serve = function launchBrowserSync(done) {
  server.init({
    cors: true,
    notify: false,
    open: true,
    server: { baseDir: './dist/' },
  });
  done();
  gulp.watch('./app/**/*.pug', html);
  gulp.watch('./app/**/*.scss', style);
};

const watchJs = function watchForJavascriptFiles() {
  return gulp.watch(jsPaths, gulp.series(scripts, reload));
};

const watchSvg = function watchForSvgFiles() {
  return gulp.watch(
    ['./app/global/svg/*.svg', './app/components/**/svg/*.svg'],
    gulp.series(copysvg, reload),
  );
};

const watchBitmaps = function watchForBitmapFiles() {
  return gulp
    .watch(
      [
        `./app/global/bitmaps/*.${bitmapExts}`,
        `./app/components/**/bitmaps/*.${bitmapExts}`,
      ],
      gulp.series(copybitmaps, reload),
    );
};

// Gulp tasks

gulp.task('svgmin', minsvg);
gulp.task('svgcopy', copysvg);
gulp.task('bitmapmin', minbitmap);
gulp.task('bitmapcopy', copybitmaps);
gulp.task('imagemin', gulp.parallel('svgmin', 'bitmapmin'));
gulp.task('imagecopy', gulp.parallel('svgcopy', 'bitmapcopy'));
gulp.task(
  'copyassets',
  gulp.parallel(copyfonts, copyfavicons, 'imagecopy', copyvideo),
);
gulp.task('watchForAll', gulp.parallel(watchJs, watchSvg, watchBitmaps));
gulp.task('build', gulp.series(cleanbuild, 'copyassets', scripts, style, html));
gulp.task('serve', gulp.series(serve, 'watchForAll'));

gulp.task('default', gulp.series('build', 'serve'));
