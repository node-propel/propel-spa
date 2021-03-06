var Mincer = require('mincer');
var path = require('path');
var zlib = require('zlib');

var MincerManager = {
  as: 'MincerManager',
  inject: ['BuildConfig', 'locals'],
  load: function(BuildConfig, locals) {
    /*
     * Use this inside your js or css if you need access any of the mincer environment methods
     *
     * ex.
     *
     * .my_class {
     *  background_image: url("$$ asset_path('minion_banana.jpg') $$");
     * }
     */
    Mincer.MacroProcessor.configure(BuildConfig.assetMacroProcessor);

    var env = new Mincer.Environment(path.join(__dirname, '..'));

    BuildConfig.assetPaths.forEach(function(assetPath) {
      env.appendPath(assetPath);
    });

    env.registerHelper('asset_path', findAsset);

    /*
     * js helper (uses findAsset)
     */
    function jsAsset(file, opts) {
      return '<script type="application/javascript" src="' + findAsset(file, opts) + '"></script>';
    }

    /*
     * css helper (uses findAsset)
     */
    function cssAsset(file, opts) {
      return '<link type="text/css" rel="stylesheet" href="' + findAsset(file, opts) + '"/>';
    }

    /*
     * findAsset helper
     */
    function findAsset(file, opts) {
      var leadingSlashes = '';
      while (file.substring(0, 3) === "../") {
        leadingSlashes += '../';
        file = file.substring(3);
      }

      var asset = env.findAsset(file, opts);
      if (!asset) {
        throw new Error("File [" + file + "] not found");
      }
      else {
        if (process.env.NODE_ENV != 'production') {
          leadingSlashes = '/';
        }
        return path.join(leadingSlashes, BuildConfig.mountPoint, asset.digestPath);
      }
    }

    /*
     * Precompile script. It will add gzip compression, source maps .etc.
     * For js and css only files containing "application" will get compiled. This prevents every
     * single file in the asset pipeline being compiled. If you want a more strict/loose match, just adjust
     * the pattern in the manifest.compile method below.
     */
    function precompile() {
      env.jsCompressor = 'uglify';
      env.cssCompressor = 'csswring';
      env = env.index;
      var manifest = new Mincer.Manifest(env, BuildConfig.assetBuildPath);

      /*
       * Ideally you would load the images via css instead. If that is the case, just remove
       * the matching pattern for the images
       */
      manifest.compile(BuildConfig.assetCompilation, { compress: true, sourceMaps: true, embeddedMappingComments: true });
    }

    function server() {
      return Mincer.createServer(env);
    }

    locals.css = cssAsset;
    locals.js = jsAsset;
    locals.asset_path = findAsset;

    return {
      env: env,
      precompile: precompile,
      server: server
    };
  }
};

module.exports = MincerManager;
