const pathResolve = require('path').resolve
const webpack = require('webpack')
const removeNil = require('shared-utils/arrays/removeNil')
const ifElse = require('shared-utils/logic/ifElse')

module.exports = function generateConfig(options) {
  const { development, app } = options
  const { paths } = app

  const isProd = !development
  const isDev = !!development
  const ifDev = ifElse(isDev)
  const ifProd = ifElse(isProd)

  return {
    entry: {
      index: [pathResolve(paths.root, './modules/index.js')],
    },

    output: {
      path: pathResolve(paths.root, './dist'),
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
        BUILD_FLAG_IS_DEV: JSON.stringify(isDev),
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
        // JAVASCRIPT
        {
          test: /\.js$/,
          // We will use babel to do all our JS processing.
          loader: 'babel-loader',
          query: {
            // We need to ensure that we do this otherwise the babelrc will
            // get interpretted and for the current configuration this will mean
            // that it will kill our webpack treeshaking feature as the modules
            // transpilation has not been disabled within in.
            babelrc: false,

            presets: removeNil([
              // JSX
              'react',
              // We exclude module transilation as webpack takes care of this
              // for us.
              ['env', { es2015: { modules: false } }],
            ]),

            plugins: removeNil(
              [
                // Class properties.
                // 'transform-class-properties',
                // Required to support react hot loader.
                // ifDevClient('react-hot-loader/babel'),
                // This decorates our components with  __self prop to JSX elements,
                // which React will use to generate some runtime warnings.
                // ifDev('transform-react-jsx-self'),
                // Adding this will give us the path to our components in the
                // react dev tools.
                // ifDev('transform-react-jsx-source'),
                // Replaces the React.createElement function with one that is
                // more optimized for production.
                // NOTE: Symbol needs to be polyfilled. Ensure this feature
                // is enabled in the polyfill.io configuration.
                // ifProd('transform-react-inline-elements'),
                // Hoists element creation to the top level for subtrees that
                // are fully static, which reduces call to React.createElement
                // and the resulting allocations. More importantly, it tells
                // React that the subtree hasn’t changed so React can completely
                // skip it when reconciling.
                // ifProd('transform-react-constant-elements'),
              ]
            ),
          },
          include: [pathResolve(paths.root, './modules')],
        },
      ]),
    },
  }
}
