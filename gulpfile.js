// *
// * -------- Plugins --------
// *

//  general
const gulp = require('gulp');
const { src, dest } = require('gulp'); // assign gulp.src and gulp.dest to use them as src and dest (without prefix - gulp.)
const plumber = require('gulp-plumber'); // prevents gulp from crushing when encountered with error in the pipeline
const del = require('del'); // plugin for deleting files
const rename = require('gulp-rename'); // plugin for renameing files
const browsersync = require('browser-sync').create();
const cacheBust = require('gulp-cache-bust'); // adds cache bust, we use it for dist

//  Pug, HTML
const pug = require('gulp-pug');
const minifyHTML = require('gulp-htmlmin');

//  CSS, SASS
const sass = require('gulp-dart-sass');
const group_media_queries = require('gulp-group-css-media-queries'); // combines all media queries in a right way and puts them at the bottom of the stylesheet
const postcss = require('gulp-postcss'); // big plugin with sub-plugins for working with CSS
const autoprefixer = require('autoprefixer'); // part of the postcss
const cssnano = require('cssnano'); // CSS minifier, part of the postcss
const tailwindcss = require('tailwindcss'); // tailwind cc
const purgecss = require('gulp-purgecss'); // remove unused selectors from css files

//  Javascript
const terser = require('gulp-terser'); // JS minifier

//  Images
const imagemin = require('gulp-imagemin'); // image minificator
const webp = require('gulp-webp'); // convert jpg and png to webp
const svgSprite = require('gulp-svg-sprite'); // sprite creation
const cheerio = require('gulp-cheerio'); // HMTL/XML parser based on jQuery, we use it to remove unnecessary attributes from svg
const replace = require('gulp-replace'); // string replacement plugin, we use it to fix one particular bug in cheerio's symbol conversion algorithm

//  Fonts
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

// *
// * -------- File Paths --------
// *

const source_folder = 'src';
const build_folder = 'build';
const dist_folder = 'dist';
const path = {
  src: {
    // '!' - don't include files starting with '_'(underscore)
    pug: [source_folder + '/pug/*.pug', '!' + source_folder + '/pug/_*.pug'],
    sass: source_folder + '/sass/style.scss',
    js: source_folder + '/js/*.js',
    content_img: source_folder + '/img/content_img/*.{jpg,png}',
    content_imgWebp: source_folder + '/img/content_img/*.webp',
    background_img: source_folder + '/img/background_img/*.{jpg,png}',
    content_svg: source_folder + '/img/content_svg/*.svg',
    background_svg: source_folder + '/img/background_svg/*.svg',
    sprite: source_folder + '/img/sprite/*.svg',
    ttfFonts: source_folder + '/fonts/**/*.ttf',
    woffFonts: source_folder + '/fonts/**/*.{woff,woff2}',
  },

  build: {
    html: build_folder,
    css: build_folder + '/css/',
    js: build_folder + '/js/',
    content_img: build_folder + '/img/content_img/',
    background_img: build_folder + '/img/background_img/',
    content_svg: build_folder + '/img/content_svg/',
    background_svg: build_folder + '/img/background_svg/',
    sprite: build_folder + '/img/sprite/',
    fonts: build_folder + '/fonts/',
  },

  dist: {
    allFiles: [dist_folder, dist_folder + '/*', dist_folder + '/**/*'],
    html: dist_folder,
    css: dist_folder + '/css/',
    js: dist_folder + '/js/',
    content_img: dist_folder + '/img/content_img/',
    background_img: dist_folder + '/img/background_img/',
    content_svg: dist_folder + '/img/content_svg/',
    background_svg: dist_folder + '/img/background_svg/',
    sprite: dist_folder + '/img/sprite/',
    fonts: dist_folder + '/fonts/',
  },

  watch: {
    pug: source_folder + '/pug/**/*.pug',
    sass: source_folder + '/sass/**/*.scss',
    js: source_folder + '/js/**/*.js',
  },

  // path for cleaning build HTML, CSS and JS folders content before compiling new versions of them
  clean_build: [
    build_folder + '/html/',
    build_folder + '/css/',
    build_folder + '/js/',
  ],

  // path for cleaning dist img folder before optimizing and sending new images to it
  clean_build_img: [
    build_folder + '/img/background_img/*',
    build_folder + '/img/content_img/*',
    build_folder + '/img/background_svg/*',
    build_folder + '/img/content_img/*',
  ],

  // path for cleaning sprite folder
  clean_build_sprite: [build_folder + '/img/background_img/sprite/*'],

  // path for cleaning dist
  clean_dist: [
    dist_folder + '/html/',
    dist_folder + '/css/',
    dist_folder + '/js/',
    dist_folder + '/img/background_img/*',
    dist_folder + '/img/content_img/*',
    dist_folder + '/img/background_svg/*',
    dist_folder + '/img/content_img/*',
    dist_folder + '/img/background_img/sprite/*',
  ],
};

// *
// * -------- Private tasks --------
// *

// build methods
const build = {
  // compile PUG and send resulting HTML files to build, call browsersync
  HTML: () => {
    return src(path.src.pug)
      .pipe(plumber())
      .pipe(
        pug({
          doctype: 'html',
        })
      )
      .pipe(dest(path.build.html))
      .pipe(browsersync.stream());
  },
  // compile SCSS and send not actually minified min.CSS to build, call browsersync
  CSS: () => {
    return (
      src(path.src.sass)
        .pipe(plumber())
        .pipe(
          sass({
            outputStyle: 'expanded',
          })
        )
        // .pipe(group_media_queries()) // ! current version is not working
        .pipe(postcss([tailwindcss(), autoprefixer()]))
        .pipe(
          rename({
            extname: '.min.css',
          })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
    );
  },
  // compile JS and send not actually minified min.js to build, call browsersync
  JS: () => {
    return src(path.src.js)
      .pipe(plumber())
      .pipe(
        rename({
          extname: '.min.js',
        })
      )
      .pipe(dest(path.build.js))
      .pipe(browsersync.stream());
  },

  // * ----- Images -----
  backgroundImg: () => {
    return src(path.src.background_img)
      .pipe(plumber())
      .pipe(
        imagemin([
          imagemin.mozjpeg({ quality: 80, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
        ])
      )
      .pipe(dest(path.build.background_img));
  },
  backgroundSvg: () => {
    return src(path.src.background_svg)
      .pipe(plumber())
      .pipe(imagemin([imagemin.svgo()]))
      .pipe(dest(path.build.background_svg));
  },
  contentImg: () => {
    return src(path.src.content_img)
      .pipe(plumber())
      .pipe(
        imagemin([
          imagemin.mozjpeg({ quality: 80, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
        ])
      )
      .pipe(dest(path.build.content_img))
      .pipe(src(path.src.content_img))
      .pipe(
        webp({
          quality: 80,
        })
      )
      .pipe(dest(path.build.content_img));
  },
  contentImgWebp: () => {
    return (
      src(path.src.content_imgWebp)
        .pipe(plumber())
        // .pipe(
        //   webp({
        //     quality: 80,
        //   })
        // )
        .pipe(dest(path.build.content_img))
    );
  },
  contentSvg: () => {
    return src(path.src.content_svg)
      .pipe(plumber())
      .pipe(imagemin([imagemin.svgo()]))
      .pipe(dest(path.build.content_svg));
  },

  // * ----- Sprite -----
  createSvgSprite: () => {
    return (
      src(path.src.sprite)
        .pipe(plumber())
        .pipe(imagemin([imagemin.svgo()]))
        // using cheerio to remove the 'style', 'fill' and 'stroke' attributes from the icons so that they do not interrupt the styles specified via css
        .pipe(
          cheerio({
            run: function ($) {
              $('[fill]').removeAttr('fill');
              $('[stroke]').removeAttr('stroke');
              $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true },
          })
        )
        // cheerio has a bug - sometimes it converts the symbol '>' to the encoding '& gt;', we use replace to fix this
        .pipe(replace('&gt;', '>'))
        .pipe(
          svgSprite({
            mode: {
              symbol: {
                sprite: '../sprite.svg',
                render: {
                  scss: {
                    dest: `../../../../${source_folder}/sass/global/_sprite.scss`,
                    template: `${source_folder}/sass/templates/_sprite_template.scss`,
                  },
                },
              },
            },
          })
        )
        .pipe(dest(path.build.sprite))
    );
  },

  // * ----- Fonts -----
  // converts TTF fonts to WOFF and exports them to build
  ttfToWoff: () => {
    return src(path.src.ttfFonts)
      .pipe(plumber())
      .pipe(ttf2woff())
      .pipe(dest(path.build.fonts));
  },
  // converts TTF fonts to WOFF2 and exports them to build
  ttfToWoff2: () => {
    return src(path.src.ttfFonts)
      .pipe(plumber())
      .pipe(ttf2woff2())
      .pipe(dest(path.build.fonts));
  },
  // send woff and woff2 fonts from src to build
  parseWoffFonts: () => {
    return src(path.src.woffFonts).pipe(plumber()).pipe(dest(path.build.fonts));
  },

  // * ----- Clean -----
  // clean HTML, CSS & JS in build
  clean: () => {
    return del(path.clean_build);
  },
  // clean img folder in build
  cleanImg: () => {
    return del(path.clean_build_img);
  },
  // clean sprite folder in build
  cleanSprite: () => {
    return del(path.clean_build_sprite);
  },
};

const purgeSafelist = [
  'skills2:w-1/2',
  'sm:flex-row',
  'sm:w-1/3',
  'sm:pr-8',
  'sm:py-8',
  'sm:w-2/3',
  'sm:pl-8',
  'sm:border-l',
  'sm:border-t-0',
  'sm:mt-0',
  'sm:text-left',
  'sm:text-3xl',
  'sm:mx-auto',
  'sm:mb-2',
  'sm:w-10/12',
  'md:w-1/2',
  'lg:w-4/6',
  'lg:w-3/4',
  'lg:w-4/5',
  'lg:w-1/3',
  'lg:w-1/2',
  'xl:w-1/3',
  'hover:text-orange-600',
  'hover:bg-orange-700',
  'hover:text-white ',
  'active:bg-orange-900',
  'active:text-orange-800',
];

// dist methods
const dist = {
  // compile PUG and send compiled HTML to dist
  HTML: () => {
    return (
      src(path.src.pug)
        .pipe(plumber())
        .pipe(
          pug({
            doctype: 'html',
          })
        )
        .pipe(minifyHTML())
        // .pipe(
        //   cacheBust({
        //     type: 'timestamp',
        //   })
        // )
        .pipe(dest(path.dist.html))
    );
  },
  // compile SCSS and send min.CSS to dist
  CSS: () => {
    return (
      src(path.src.sass)
        .pipe(plumber())
        .pipe(
          sass({
            outputStyle: 'expanded',
          })
        )
        // .pipe(group_media_queries()) // ! current version is not working
        .pipe(postcss([tailwindcss(), autoprefixer(), cssnano()]))
        .pipe(
          purgecss({
            content: ['src/pug/*.pug', 'dist/*.html'],
            safelist: purgeSafelist, // page-size selectors are safelisted
          })
        )
        .pipe(
          rename({
            extname: '.min.css',
          })
        )
        // .pipe(
        //   cacheBust({
        //     type: 'timestamp',
        //   })
        // )
        .pipe(dest(path.dist.css))
    );
  },
  // compile JS and send min.js to dist
  JS: () => {
    return (
      src(path.src.js)
        .pipe(plumber())
        .pipe(terser())
        .pipe(
          rename({
            extname: '.min.js',
          })
        )
        // .pipe(
        //   cacheBust({
        //     type: 'timestamp',
        //   })
        // )
        .pipe(dest(path.dist.js))
    );
  },

  // * ----- Images -----
  backgroundImg: () => {
    return src(path.src.background_img)
      .pipe(plumber())
      .pipe(
        imagemin([
          imagemin.mozjpeg({ quality: 80, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
        ])
      )
      .pipe(dest(path.dist.background_img));
  },
  backgroundSvg: () => {
    return src(path.src.background_svg)
      .pipe(plumber())
      .pipe(imagemin([imagemin.svgo()]))
      .pipe(dest(path.dist.background_svg));
  },
  contentImg: () => {
    return src(path.src.content_img)
      .pipe(plumber())
      .pipe(
        imagemin([
          imagemin.mozjpeg({ quality: 80, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
        ])
      )
      .pipe(dest(path.dist.content_img))
      .pipe(src(path.src.content_img))
      .pipe(
        webp({
          quality: 80,
        })
      )
      .pipe(dest(path.dist.content_img));
  },
  contentImgWebp: () => {
    return (
      src(path.src.content_imgWebp)
        .pipe(plumber())
        // .pipe(
        //   webp({
        //     quality: 80,
        //   })
        // )
        .pipe(dest(path.dist.content_img))
    );
  },
  contentSvg: () => {
    return src(path.src.content_svg)
      .pipe(plumber())
      .pipe(imagemin([imagemin.svgo()]))
      .pipe(dest(path.dist.content_svg));
  },

  //* ----- Sprite -----
  createSvgSprite: () => {
    return (
      src(path.src.sprite)
        .pipe(plumber())
        .pipe(imagemin([imagemin.svgo()]))
        // using cheerio to remove the 'style', 'fill' and 'stroke' attributes from the icons so that they do not interrupt the styles specified via css
        .pipe(
          cheerio({
            run: function ($) {
              $('[fill]').removeAttr('fill');
              $('[stroke]').removeAttr('stroke');
              $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true },
          })
        )
        // cheerio has a bug - sometimes it converts the symbol '>' to the encoding '& gt;', we use replace plugin to fix this
        .pipe(replace('&gt;', '>'))
        .pipe(
          svgSprite({
            mode: {
              symbol: {
                sprite: '../sprite.svg',
                render: {
                  scss: {
                    dest: `../../../../${source_folder}/sass/global/_sprite.scss`,
                    template: `${source_folder}/sass/templates/_sprite_template.scss`,
                  },
                },
              },
            },
          })
        )
        .pipe(dest(path.dist.sprite))
    );
  },

  // * ----- Fonts -----
  // converts TTF fonts to WOFF and exports them to dist
  ttfToWoff: () => {
    return src(path.src.ttfFonts)
      .pipe(plumber())
      .pipe(ttf2woff())
      .pipe(dest(path.dist.fonts));
  },
  // converts TTF fonts to WOFF2 and exports them to dist
  ttfToWoff2: () => {
    return src(path.src.ttfFonts)
      .pipe(plumber())
      .pipe(ttf2woff2())
      .pipe(dest(path.dist.fonts));
  },
  // send woff and woff2 fonts from src to dist
  parseWoffFonts: () => {
    return src(path.src.woffFonts).pipe(plumber()).pipe(dest(path.dist.fonts));
  },

  // * ----- Clean -----
  clean: () => {
    return del(path.clean_dist);
  },
};

// launch browserSync
function browserSync() {
  browsersync.init({
    server: {
      baseDir: ['./' + build_folder + '/'],
    },
    browser: [
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      // 'C:\\Program Files\\Firefox Developer Edition\\firefox.exe',
    ],
    port: 3000,
    notify: false,
    injectChanges: true,
  });
}
// watch changes in source folder's HTML, SCSS and JS files and runs the build compiling tasks
function watchSource() {
  gulp.watch([path.watch.pug], build.HTML);
  gulp.watch([path.watch.sass], build.CSS);
  // gulp.watch([path.watch.js], build.JS); // ! don't currently have any JS in the project
}

// *
// * --------Public tasks--------
// *

// clean build, compile build, launch browserSync and start watching src
const watchProject = gulp.parallel(
  // this .series compiles HTML, CSS and JS
  gulp.series(
    build.clean,
    gulp.parallel(build.HTML, build.CSS) // ! 'build.JS' is currently excluded from this gulp.parellel() because we don't use any JS in the project
  ),
  watchSource,
  browserSync
);

const buildImg = gulp.series(
  build.cleanImg,
  gulp.parallel(
    build.backgroundImg,
    build.backgroundSvg,
    build.contentImg,
    build.contentImgWebp,
    build.contentSvg
  )
);

const buildSprite = gulp.series(build.cleanSprite, build.createSvgSprite);

const buildFonts = gulp.parallel(
  build.ttfToWoff,
  build.ttfToWoff2,
  build.parseWoffFonts
);

// clean dist folder and assemble it anew
const distProject = gulp.series(
  dist.clean,
  gulp.parallel(
    dist.HTML,
    dist.CSS,
    // dist.JS, // ! 'dist.JS' is currently excluded from dist assembly because we don't have any JS in the project

    dist.backgroundImg,
    dist.backgroundSvg,
    dist.contentImg,
    dist.contentImgWebp,
    dist.contentSvg,

    dist.createSvgSprite,

    dist.ttfToWoff,
    dist.ttfToWoff2,
    dist.parseWoffFonts
  )
);

// *
// * -------- Exports --------
// *

exports.default = watchProject;
exports.img = buildImg;
exports.sprite = buildSprite;
exports.font = buildFonts;
exports.dist = distProject;

// ! list of commands: gulp, gulp img, gulp sprite, gulp font, gulp dist
