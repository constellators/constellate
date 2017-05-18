const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const autoprefixer = require('autoprefixer')

const removeNil = require('constellate-utils/arrays/removeNil')
const ifElse = require('constellate-utils/logic/ifElse')

const generateBabelConfig = require('../babel/generateConfig')

module.exports = function generateConfig(options) {
  const { development, project } = options
  const { paths, config } = project
  const { browser } = config

  const isProd = !development
  const isDev = !!development
  const ifDev = ifElse(isDev)
  const ifProd = ifElse(isProd)

  const defaultConfig = {
    context: paths.root,

    entry: {
      [project.name]: removeNil([
        // Include babel's polyfill to support ES6 features on browser.
        'babel-polyfill',
        ifDev(
          `${require.resolve('webpack-dev-server/client')}?http://0.0.0.0:${browser.develop.port}`
        ),
        ifDev(require.resolve('webpack/hot/dev-server')),
        // The application source entry.
        paths.sourceEntry,
      ]),
    },

    output: {
      // The dir in which our bundle should be output.
      path: paths.dist,
      // The filename format for the entry chunk.
      filename: isDev ? '[name].js' : '[name]-[chunkhash].js',
      // The name format for any additional chunks produced for the bundle.
      chunkFilename: isDev ? '[name]-[hash].js' : '[name]-[chunkhash].js',
      // This is the web path under which our webpack bundled client should
      // be considered as being served from.
      publicPath: ifDev(
        // As we run a seperate development server for our client and server
        // bundles we need to use an absolute http path for the public path.
        `http://localhost:${browser.develop.port}/${project.name}`,
        // Otherwise we expect our bundled client to be served from this path.
        `/${project.name}`
      ),
      pathinfo: isDev,
    },

    devServer: isDev
      ? {
        host: '0.0.0.0',
        disableHostCheck: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        compress: true,
        port: browser.develop.port,
        noInfo: true,
        quiet: true,
        historyApiFallback: true,
        hot: true,
        watchOptions: {
            // Watching too many files can result in high CPU/memory usage.
            // We will manually control reloads based on dependency changes.
          ignored: /node_modules/,
            // TODO: Allow watching of any dependencies that are Constellate projects.
        },
      }
      : undefined,

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
      // our webpack bundle.  A necessisty for our server rendering process
      // as we need to interogate these files in order to know what JS/CSS
      // we need to inject into our HTML. We only need to know the assets for
      // our client bundle.
      new AssetsPlugin({
        filename: 'assets.json',
        path: paths.dist,
      }),

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

      // For the production build of the client we need to extract the CSS into
      // CSS files.
      ifProd(
        () =>
          new ExtractTextPlugin({
            filename: '[name].[contenthash:8].css',
            allChunks: true,
          })
      ),

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
          query: generateBabelConfig({ project }),
          include: [paths.source],
        },

        {
          test: /\.(jpg|jpeg|png|gif|eot|svg|ttf|woff|woff2)$/,
          loader: 'file-loader',
          include: [paths.source],
          options: {
            limit: 20000,
          },
        },

        {
          test: /\.css$/,
          loader: ifDev(
            () => [
              'style-loader',
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
            () =>
              ExtractTextPlugin.extract({
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
              })
          ),
          include: [paths.source, paths.nodeModules],
        },
      ]),
    },
  }

  return browser.webpack
    ? browser.webpack(defaultConfig, { development, project, webpack })
    : defaultConfig
}
