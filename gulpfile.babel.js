var gulp = require('gulp');
var connect = require('gulp-connect');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var nested = require('postcss-nested');
var atImport = require("postcss-import");
var rename = require("gulp-rename");
var path = require('path');
var util = require('gulp-util');

// Start local dev server.
gulp.task('serve', function () {
  connect.server({
    root: "src",
    port: 8085,
    https: false,
    livereload: true
  });
});

var postcss_processors = [
  atImport,
  nested,
  autoprefixer
];

var postcss_options = {

};

gulp.task('postcss', function() {
  gulp.src("src/main.css").
    pipe(postcss(postcss_processors, postcss_options)).
    pipe(rename({
      extname : ".bundle.css"
    })).
    pipe(gulp.dest("src")).
    pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch(["src/**/*.css", "!src/**/*.bundle.css"], ["postcss"]).on('change', logChanges);
  gulp.watch(["src/**/*.vue"], ["vueify"]).on('change', logChanges);
});

function logChanges(event) {
  util.log(
    util.colors.green('File ' + event.type + ': ') +
    util.colors.magenta(path.basename(event.path))
  );
}



var through = require('through2');
var parse5 = require('parse5');
var deindent = require('de-indent');
var File = require('vinyl');

function vueifyPlugin() {
  var transform = function(file, encoding, callback)
  {
    var content = file.contents.toString('utf8');
    var fragment = parse5.parseFragment(content, {
      locationInfo: true
    });

    var filePath = file.path;
    var id = "";
    var hasScopedStyle = false;

    Promise.all(fragment.childNodes.map((node) => {
      switch (node.nodeName) {
        case 'template':
          var segmentContent = deindent(parse5.serialize(node.content));
          this.push(new File({
            contents: new Buffer(segmentContent),
            path: filePath.replace(".vue", ".html")
          }));
          break;

        case 'style':
          var segmentContent = deindent(parse5.serialize(node));
          this.push(new File({
            contents: new Buffer(segmentContent),
            path: filePath.replace(".vue", ".css")
          }));
          break;

        case 'script':
          var segmentContent = deindent(parse5.serialize(node));
          this.push(new File({
            contents: new Buffer(segmentContent),
            path: filePath.replace(".vue", ".js")
          }));
          break;
      }
    })).then(callback);
  };

  return through.obj(transform);
};

gulp.task('vueify', function() {
  gulp.src("src/**/*.vue").
    pipe(vueifyPlugin()).
    pipe(gulp.dest("."));
});
