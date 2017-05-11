const path = require('path')
const webpack = require('webpack')
const removeNil = require('constellate-utils/arrays/removeNil')
const ifElse = require('constellate-utils/logic/ifElse')
const generateBabelConfig = require('../babel/generateConfig')

module.exports = function generateConfig(options) {
  const { development, project } = options
  const { paths } = project

  const isProd = !development
  const isDev = !!development
  const ifDev = ifElse(isDev)
  const ifProd = ifElse(isProd)

  return {
    entry: {
      index: [paths.sourceEntry],
    },

    output: {
      path: paths.dist,
      filename: '[name].js',
      // The name format for any additional chunks produced for the bundle.
      chunkFilename: '[name]-[chunkhash].js',
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
    ]),

    module: {
      rules: removeNil([
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: generateBabelConfig({ project }),
          include: [paths.source],
        },
      ]),
    },
  }
}
