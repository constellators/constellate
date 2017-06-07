/**
 * Tons of inspiration taken from @jaredpalmer's amazing Razzle project,
 * and Facebook/@gaearon's superb Create React App project.
 * https://github.com/jaredpalmer/razzle
 * https://github.com/facebookincubator/create-react-app
 * ❤️
 */

const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const R = require('ramda')
const { removeNil } = require('constellate-dev-utils/modules/arrays')
const { onlyIf } = require('constellate-dev-utils/modules/logic')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const generateBabelConfig = require('./generateBabelConfig')

module.exports = function generateConfig(project) {
  const allProjects = ProjectUtils.getAllProjects()

  const bundledDependencies = allProjects.filter(
    x => !!R.find(R.equals(x.name), project.bundledDependencies),
  )

  const env = process.env.NODE_ENV
  const bundledDepsModulePaths = bundledDependencies.map(dep => dep.paths.modules)

  return {
    // Keep quiet in dev mode.
    stats: onlyIf(env === 'development', 'none'),

    target: 'node',

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
      // use a predictable name format.
      filename: '[name].js',

      // The name format for any additional chunks produced for the bundle.
      chunkFilename: env === 'development' ? '[name]-[hash].js' : '[name]-[chunkhash].js',

      publicPath: `/constellate/${project.name}/`,

      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: env === 'development',

      libraryTarget: 'commonjs2',
    },

    resolve: {
      extensions: ['.js', '.json', '.jsx'],
    },

    // Ensure that webpack polyfills the following node features
    node: { console: true },

    // The following makes sure that we don't bundle all our dependencies within
    // our node bundle. This is important as not all deps will be supported by
    // the bundling process. Instead they will be resolved at run time.
    externals: [
      nodeExternals({
        // There are however some file types and dependencies that we do wish
        // to processed by webpack:
        whitelist: removeNil([
          'source-map-support/register',
          /\.(eot|woff|woff2|ttf|otf)$/,
          /\.(svg|png|jpg|jpeg|gif|ico)$/,
          /\.(mp4|mp3|ogg|swf|webp)$/,
          /\.(css|scss|sass|sss|less)$/,
          ...bundledDependencies.map(dep => ProjectUtils.getPackageName(dep.name)),
        ]),
        modulesDir: project.paths.nodeModules,
      }),
    ],

    // Produces an external source map (lives next to bundle output files).
    // We always want source maps for node bundles to help with stack traces.
    devtool: 'source-map',

    // https://webpack.js.org/configuration/performance/
    performance: {
      hints: false,
    },

    plugins: removeNil([
      new webpack.EnvironmentPlugin({
        // It is really important to use NODE_ENV=production in order to use
        // optimised versions of some node_modules, such as React.
        NODE_ENV: env,
        // Is this a browser build?
        CONSTELLATE_IS_WEBPACK: JSON.stringify(true),
      }),

      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

      // This makes debugging much easier as webpack will add filenames to
      // modules
      onlyIf(env === 'development', () => new webpack.NamedModulesPlugin()),

      // This grants us source map support, which combined with our webpack
      // source maps will give us nice stack traces for our node executed
      // bundles.
      // We use the BannerPlugin to make sure all of our chunks will get the
      // source maps support installed.
      onlyIf(
        env === 'development',
        new webpack.BannerPlugin({
          banner: 'require("source-map-support").install();',
          raw: true,
          entryOnly: false,
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
              options: generateBabelConfig(project),
            },
          ],
          include: [project.paths.modules, ...bundledDepsModulePaths],
        },

        {
          test: /\.(jpg|jpeg|png|gif|ico|eot|svg|ttf|woff|woff2|otf|mp4|mp3|ogg|swf|webp)$/,
          loader: 'url-loader',
          options: {
            // We only emit files when building a web bundle, node bundles only
            // need the file paths.
            emitFile: false,
            // Any files under this size will be "inlined" as a base64 encoding.
            limit: 10000,
          },
        },

        // When targetting node we use the "/locals" version of the
        // css loader, as we don't need any css files.
        {
          test: /\.css$/,
          loaders: ['css-loader/locals'],
          include: [project.paths.modules, project.paths.nodeModules, ...bundledDepsModulePaths],
        },
      ]),
    },
  }
}
