/**
 * Tons of inspiration taken from @jaredpalmer's amazing Razzle project,
 * and Facebook/@gaearon's superb Create React App project.
 * https://github.com/jaredpalmer/razzle
 * https://github.com/facebookincubator/create-react-app
 * ❤️
 */

const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const nodeExternals = require('webpack-node-externals')
const autoprefixer = require('autoprefixer')
const R = require('ramda')
const { removeNil } = require('constellate-dev-utils/arrays')
const { onlyIf } = require('constellate-dev-utils/logic')
const BabelUtils = require('../babel')

module.exports = function generateConfig(project, options = {}) {
  const { devServerPort } = options

  const env = process.env.NODE_ENV

  const isTargettingWeb = project.config.target === 'web'
  const isTargettingNode = !isTargettingWeb

  const webpackConfig = {
    // Keep quiet in dev mode.
    stats: onlyIf(env === 'development', 'none'),

    target: isTargettingWeb ? 'web' : 'node',

    context: project.paths.root,

    entry: {
      // We name it "index" to make it easy to resolve the entry files within
      // the bundled output.
      index: [
        // The application source entry.
        project.paths.modulesEntry,
      ],
    },

    output: {
      // The dir in which our bundle should be output.
      path: project.paths.buildModules,

      // The filename format for the entry chunk.
      // eslint-disable-next-line no-nested-ternary
      filename: isTargettingWeb && env === 'production'
        ? // For a production build of a web target we want a cache busting
          // name format.
          '[name]-[chunkhash].js'
        : // Else we use a predictable name format.
          '[name].js',

      // The name format for any additional chunks produced for the bundle.
      chunkFilename: env === 'development' ? '[name]-[hash].js' : '[name]-[chunkhash].js',

      publicPath: isTargettingWeb && env === 'development'
        ? // As we run a seperate webpack-dev-server in development we need an
          // absolute http path for the public path.
          `http://0.0.0.0:${devServerPort}/constellate/${project.name}/`
        : `/constellate/${project.name}/`,

      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: env === 'development',

      libraryTarget: isTargettingNode ? 'commonjs2' : 'var',
    },

    resolve: {
      extensions: ['.js', '.json', '.jsx'],
    },

    // Ensure that webpack polyfills the following node features
    node: onlyIf(isTargettingNode, { console: true }),

    // The following makes sure that we don't bundle all our dependencies within
    // our node bundle. This is important as not all deps will be supported by
    // the bundling process. Instead they will be resolved at run time.
    externals: onlyIf(isTargettingNode, [
      nodeExternals({
        // There are however some file types and dependencies that we do wish
        // to processed by webpack:
        whitelist: removeNil([
          'source-map-support/register',
          /\.(eot|woff|woff2|ttf|otf)$/,
          /\.(svg|png|jpg|jpeg|gif|ico)$/,
          /\.(mp4|mp3|ogg|swf|webp)$/,
          /\.(css|scss|sass|sss|less)$/,
        ]),
        modulesDir: project.paths.nodeModules,
      }),
    ]),

    // Source map settings.
    devtool: env === 'development' || isTargettingNode
      ? // Produces an external source map (lives next to bundle output files).
        // We always want source maps for node bundles to help with stack traces.
        'source-map'
      : // Only maps line numbers
        'cheap-eval-source-map',

    // https://webpack.js.org/configuration/performance/
    performance: {
      hints: env === 'development' ? false : 'warning',
    },

    plugins: removeNil([
      new webpack.EnvironmentPlugin({
        // It is really important to use NODE_ENV=production in order to use
        // optimised versions of some node_modules, such as React.
        NODE_ENV: env,
        // Is this a browser build?
        CONSTELLATE_IS_WEBPACK: JSON.stringify(true),
      }),

      // Generates a JSON file containing a map of all the output files for
      // our webpack bundle.
      onlyIf(
        isTargettingWeb,
        () =>
          new AssetsPlugin({
            filename: 'webpack-manifest.json',
            path: project.paths.buildModules,
          }),
      ),

      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

      // This makes debugging much easier as webpack will add filenames to
      // modules
      onlyIf(env === 'development', () => new webpack.NamedModulesPlugin()),

      // For our production web targets we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      onlyIf(
        isTargettingWeb && env === 'production',
        () =>
          new webpack.optimize.UglifyJsPlugin({
            // sourceMap: config('includeSourceMapsForOptimisedClientBundle'),
            compress: {
              screw_ie8: true,
              warnings: false,
            },
            mangle: {
              screw_ie8: true,
            },
            output: {
              comments: false,
              screw_ie8: true,
            },
          }),
      ),

      // For our production web targets we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      onlyIf(
        isTargettingWeb && env === 'production',
        () =>
          new webpack.LoaderOptionsPlugin({
            minimize: true,
          }),
      ),

      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebookincubator/create-react-app/issues/240
      onlyIf(env === 'development', () => new CaseSensitivePathsPlugin()),

      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebookincubator/create-react-app/issues/186
      onlyIf(
        isTargettingWeb && env === 'development',
        () => new WatchMissingNodeModulesPlugin(project.paths.nodeModules),
      ),

      // We don't want webpack errors to occur during development as it will
      // kill our dev servers.
      onlyIf(isTargettingWeb && env === 'development', () => new webpack.NoEmitOnErrorsPlugin()),

      // We need this plugin to enable hot reloading of our client.
      onlyIf(
        isTargettingWeb && env === 'development',
        () => new webpack.HotModuleReplacementPlugin(),
      ),

      // For a production build of a web target we need to extract the CSS into
      // CSS files.
      onlyIf(
        isTargettingWeb && env === 'production',
        () =>
          new ExtractTextPlugin({
            filename: '[name].[contenthash:8].css',
            allChunks: true,
          }),
      ),

      // This grants us source map support, which combined with our webpack
      // source maps will give us nice stack traces for our node executed
      // bundles.
      // We use the BannerPlugin to make sure all of our chunks will get the
      // source maps support installed.
      onlyIf(
        isTargettingNode && env === 'development',
        new webpack.BannerPlugin({
          banner: 'require("source-map-support").install();',
          raw: true,
          entryOnly: false,
        }),
      ),

      // This will inject the module.hot.accept code in the entry file for our
      // development build.
      onlyIf(
        isTargettingWeb && env === 'development',
        () =>
          // eslint-disable-next-line global-require
          new (require('./plugins/InjectHMRCodeForEntryModule.js'))({
            entryFile: project.paths.modulesEntry,
          }),
      ),
    ]),

    module: {
      rules: removeNil([
        {
          test: /\.js$/,
          use: [
            {
              loader: 'cache-loader',
              options: {
                cacheDirectory: project.paths.webpackCache,
              },
            },
            {
              loader: 'babel-loader',
              options: BabelUtils.generateConfig(project),
            },
          ],
          include: [project.paths.modules],
        },

        {
          test: /\.(jpg|jpeg|png|gif|ico|eot|svg|ttf|woff|woff2|otf|mp4|mp3|ogg|swf|webp)$/,
          loader: 'url-loader',
          options: {
            // We only emit files when building a web bundle, node bundles only
            // need the file paths.
            emitFile: isTargettingWeb,
            // Any files under this size will be "inlined" as a base64 encoding.
            limit: 10000,
          },
        },

        // For development web targets we will use the style loader which will
        // allow hot reloading of the CSS.
        onlyIf(isTargettingWeb && env === 'development', () => ({
          test: /\.css$/,
          loader: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                // Include sourcemaps for dev experience++.
                sourceMap: true,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: () => [
                  autoprefixer({
                    browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
                  }),
                ],
              },
            },
          ],
          include: [project.paths.modules, project.paths.nodeModules],
        })),

        // For a production web target we use the ExtractTextPlugin which
        // will extract our CSS into CSS files.
        // Note: The ExtractTextPlugin needs to be registered within the
        // plugins section too.
        onlyIf(isTargettingWeb && env === 'production', () => ({
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    autoprefixer({
                      browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
                    }),
                  ],
                },
              },
            ],
          }),
          include: [project.paths.modules, project.paths.nodeModules],
        })),

        // When targetting node we use the "/locals" version of the
        // css loader, as we don't need any css files.
        onlyIf(isTargettingNode, {
          test: /\.css$/,
          loaders: ['css-loader/locals'],
          include: [project.paths.modules, project.paths.nodeModules],
        }),
      ]),
    },
  }

  if (isTargettingWeb && env === 'development') {
    webpackConfig.entry.index = [
      `webpack-dev-server/client?http://0.0.0.0:${devServerPort}`,
      'webpack/hot/dev-server',
      ...webpackConfig.entry.index,
    ]

    // For web target packages we rely on webpack-dev-server, but will provide
    // the configuration here to make our configuration more centralised.
    webpackConfig.devServer = {
      host: '0.0.0.0',
      port: devServerPort,
      contentBase: false,
      disableHostCheck: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      compress: true,
      publicPath: webpackConfig.output.publicPath,
      noInfo: true,
      quiet: true,
      historyApiFallback: true,
      hot: true,
      // Will show compile errors in browser.
      overlay: true,
      watchOptions: {
        // Watching too many files can result in high CPU/memory usage.
        // We will manually control reloads based on dependency changes.
        ignored: /node_modules/,
        // TODO: Allow watching of any dependencies that are Constellate projects.
      },
    }
  }

  const webpackPlugin = R.path(['plugins', 'webpack'], project)

  return webpackPlugin ? webpackPlugin(webpackConfig, { project, webpack }) : webpackConfig
}
