/* eslint no-console: 0 */

/*
========================================================================
   Distribution Build
========================================================================
*/

import gulp from "gulp"
import assetgraph from "assetgraph"
import del from "del"

gulp.task("clean-dist", () =>
  del([ "dist" ])
)

gulp.task("dist", [ "clean-dist", "build" ], function(done)
{
  var query = assetgraph.query;

  new assetgraph({root: "."})
    .on("addAsset", function (asset) {
      console.log("AssetGraph Add:", asset.toString());
    })
    .loadAssets("*.html")
    .populate({
      followRelations: {
        hrefType: ["relative", "rootRelative"],
        type: query.not([
          // Keep copying source maps but ignore content for further dependency tracking
          "SourceMapSource"
        ])
      }
    })
    .moveAssetsInOrder({
      type: query.not([
        'Html'
      ])
    }, function (asset) {
      return '/static/' + asset.md5Hex.substr(0, 8) + asset.extension;
    })
    .writeAssetsToDisc({
      isLoaded: true
    }, "dist")
    .run(function (err) {
      if (err) {
        console.error("AssetGraph Error:", err);
      }

      done();
    });
})