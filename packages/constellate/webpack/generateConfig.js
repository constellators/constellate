/**
 * Tons of "inspiration" (i.e. outright copy and paste) taken from @jaredpalmer's
 * amazing Razzle project, and @gaearon's superb Create React App project.
 * https://github.com/jaredpalmer/razzle
 * https://github.com/facebookincubator/create-react-app
 */

const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const StartServerPlugin = require('start-server-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const nodeExternals = require('webpack-node-externals')
const autoprefixer = require('autoprefixer')
const R = require('ramda')

const removeNil = require('constellate-utils/arrays/removeNil')
const ifElse = require('constellate-utils/logic/ifElse')

const generateBabelConfig = require('../babel/generateConfig')

module.exports = function generateConfig(project, options = {}) {
  const { development = false, devServerPort } = options

  const isProd = !development
  const isDev = !!development
  const ifDev = ifElse(isDev)
  const ifProd = ifElse(isProd)

  const isWeb = !!project.config.web
  const isNode = !isWeb

  const webpackConfig = {
    context: project.paths.root,

    entry: {
      [project.name]: [
        // The application source entry.
        project.paths.sourceEntry,
      ],
    },

    output: {
      // The dir in which our bundle should be output.
      path: project.paths.dist,
      // The filename format for the entry chunk.
      filename: isDev ? '[name].js' : '[name]-[chunkhash].js',
      // The name format for any additional chunks produced for the bundle.
      chunkFilename: isDev ? '[name]-[hash].js' : '[name]-[chunkhash].js',
      publicPath: '/',
      pathinfo: isDev,
    },

    // Source map settings.
    devtool: isDev
      ? // Produces an external source map (lives next to bundle output files).
        'source-map'
      : // Only maps line numbers
        'cheap-eval-source-map',

    // https://webpack.js.org/configuration/performance/
    performance: {
      hints: isDev ? false : 'warning',
    },

    plugins: removeNil([
      new webpack.EnvironmentPlugin({
        // It is really important to use NODE_ENV=production in order to use
        // optimised versions of some node_modules, such as React.
        NODE_ENV: isProd ? 'production' : 'development',
        // Is this a development build?
        CONSTELLATE_IS_DEV: JSON.stringify(isDev),
        // Is this a browser build?
        CONSTELLATE_IS_WEBPACK: JSON.stringify(true),
      }),

      // Generates a JSON file containing a map of all the output files for
      // our webpack bundle.
      new AssetsPlugin({
        filename: 'webpack-manifest.json',
        path: project.paths.dist,
      }),

      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

      // This makes debugging much easier as webpack will add filenames to
      // modules
      ifDev(() => new webpack.NamedModulesPlugin()),

      // For our production build we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      ifProd(
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
          })
      ),

      // For our production client we need to make sure we pass the required
      // configuration to ensure that the output is minimized/optimized.
      ifProd(
        () =>
          new webpack.LoaderOptionsPlugin({
            minimize: true,
          })
      ),

      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebookincubator/create-react-app/issues/240
      ifDev(() => new CaseSensitivePathsPlugin()),

      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebookincubator/create-react-app/issues/186
      ifDev(() => new WatchMissingNodeModulesPlugin(project.paths.nodeModules)),

      // We don't want webpack errors to occur during development as it will
      // kill our dev servers.
      ifDev(() => new webpack.NoEmitOnErrorsPlugin()),

      // We need this plugin to enable hot reloading of our client.
      ifDev(() => new webpack.HotModuleReplacementPlugin()),
    ]),

    module: {
      rules: removeNil([
        {
          test: /\.js$/,
          loader: 'babel-loader',
          options: generateBabelConfig(project, { development }),
          include: [project.paths.source],
        },

        {
          test: /\.(jpg|jpeg|png|gif|ico|eot|svg|ttf|woff|woff2|otf|mp4|mp3|ogg|swf|webp)$/,
          loader: 'url-loader',
          options: {
            // We only emit files when building a web bundle, node bundles only
            // need the file paths.
            emitFile: isWeb,
            // Any files under this size will be "inlined" as a base64 encoding.
            limit: 10000,
          },
        },
      ]),
    },
  }

  if (isWeb) {
    webpackConfig.target = 'web'

    webpackConfig.entry[project.name] = removeNil([
      'babel-polyfill',
      ifDev(`webpack-dev-server/client?http://0.0.0.0:${devServerPort}`),
      ifDev('webpack/hot/dev-server'),
      ...webpackConfig.entry[project.name],
    ])

    webpackConfig.plugins = removeNil([
      ...webpackConfig.plugins,
      // For the production build of the client we need to extract the CSS into
      // CSS files.
      ifProd(
        () =>
          new ExtractTextPlugin({
            filename: '[name].[contenthash:8].css',
            allChunks: true,
          })
      ),
    ])

    webpackConfig.module.rules = removeNil([
      ...webpackConfig.module.rules,
      // For development clients we will use the style loader which will allow
      // hot reloading of the CSS.
      ifDev(() => ({
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
        include: [project.paths.source, project.paths.nodeModules],
      })),
      // For a production client build we use the ExtractTextPlugin which
      // will extract our CSS into CSS files.
      // Note: The ExtractTextPlugin needs to be registered within the
      // plugins section too.
      ifProd(() => ({
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
        include: [project.paths.source, project.paths.nodeModules],
      })),
    ])

    if (isDev) {
      webpackConfig.stats = 'none'

      // As we run a seperate webpack-dev-server in development we need an
      // absolute http path for the public path.
      webpackConfig.output.publicPath = `http://0.0.0.0:${devServerPort}/`

      // For browser packages we rely on webpack-dev-server, but will provide
      // the configuration here to make our configuration more centralised.
      webpackConfig.devServer = {
        host: '0.0.0.0',
        disableHostCheck: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        compress: true,
        port: devServerPort,
        noInfo: true,
        quiet: true,
        historyApiFallback: true,
        hot: true,
        watchOptions: {
          // Watching too many files can result in high CPU/memory usage.
          // We will manually control reloads based on dependency changes.
          // ignored: /node_modules/,
          // TODO: Allow watching of any dependencies that are Constellate projects.
        },
      }
    }
  } else if (isNode) {
    webpackConfig.target = 'node'

    webpackConfig.entry[project.name] = removeNil([
      ifDev('webpack/hot/poll?300'),
      ...webpackConfig.entry[project.name],
    ])

    // For a node bundle we don't use the webpack-dev-server therefore we
    // need to explictly enable watch mode.
    webpackConfig.watch = isDev

    // Ensure that webpack polyfills the following node features
    webpackConfig.node = { console: true }

    // The following makes sure that we don't bundle all our dependencies within
    // our node bundle. This is important as not all deps will be supported by
    // the bundling process. Instead they will be resolved at run time.
    webpackConfig.externals = [
      nodeExternals({
        // There are however some file types and dependencies that we do wish
        // to include in our bundle:
        whitelist: removeNil([
          ifDev('webpack/hot/poll?300'),
          'source-map-support/register',
          /\.(eot|woff|woff2|ttf|otf)$/,
          /\.(svg|png|jpg|jpeg|gif|ico)$/,
          /\.(mp4|mp3|ogg|swf|webp)$/,
          /\.(css|scss|sass|sss|less)$/,
        ]),
      }),
    ]

    webpackConfig.plugins = removeNil([
      ...webpackConfig.plugins,
      // This grants us source map support, which combined with our webpack
      // source maps will give us nice stack traces for our node executed
      // bundles.
      // We use the BannerPlugin to make sure all of our chunks will get the
      // source maps support installed.
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false,
      }),
      // This allows us to run our bundled server after it is compiled
      // TODO: Expose a mechanism to pass-through arguments to the process.
      ifDev(new StartServerPlugin(`${project.name}.js`)),
    ])

    webpackConfig.module.rules = removeNil([
      ...webpackConfig.module.rules,
      {
        test: /\.css$/,
        // When targetting the server we use the "/locals" version of the
        // css loader, as we don't need any css files.
        loaders: ['css-loader/locals'],
        include: [project.paths.source, project.paths.nodeModules],
      },
    ])
  }

  const webpackPlugin = R.path(['plugins', 'webpack'], project)

  return webpackPlugin
    ? webpackPlugin(webpackConfig, { project, development, webpack })
    : webpackConfig
}
