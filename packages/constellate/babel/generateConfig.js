/**
 * Tons of inspiration taken from @jaredpalmer's amazing Razzle project,
 * and Facebook/@gaearon's superb Create React App project.
 * https://github.com/jaredpalmer/razzle
 * https://github.com/facebookincubator/create-react-app
 */

const path = require('path')
const R = require('ramda')

const removeNil = require('constellate-utils/arrays/removeNil')
const onlyIf = require('constellate-utils/logic/onlyIf')

// :: Options -> BabelConfig
module.exports = function generateConfig(project) {
  const isTargettingWeb = !!project.config.web
  const isTargettingNode = !isTargettingWeb

  const usingWebpackAsCompiler = R.path(['config', 'compiler'], project) === 'webpack'

  const env = process.env.BABEL_ENV || process.env.NODE_ENV

  const babelConfig = {
    babelrc: false,

    // Handy for sourcemaps generation.
    sourceRoot: project.paths.source,

    // Source maps will be useful for debugging errors in our node executions.
    sourceMaps: isTargettingNode ? 'both' : false,

    presets: removeNil([
      onlyIf(isTargettingWeb, [
        'env',
        {
          targets: {
            // React parses on ie 9, so we should too
            ie: 9,
            // We currently minify with uglify
            // Remove after https://github.com/mishoo/UglifyJS2/issues/448
            uglify: true,
          },
          // Disable polyfill transforms
          // useBuiltIns: false,
          // Do not transform modules to CJS
          modules: false,
        },
      ]),

      onlyIf(isTargettingNode, [
        'env',
        {
          targets: {
            node: 'current',
          },
          // If we are using webpack as a compiler then we will need to ignore
          // transpilation of es-modules as they are handled by webpack.
          modules: usingWebpackAsCompiler
            ? // don't transpile es-modules
              false
            : // else transpile them to cjs
              'commonjs',
        },
      ]),
      // jsx && flow support
      'react',
    ]),

    plugins: removeNil([
      // const { foo, ...others } = object
      // object = { foo, ...others }
      // This plugin uses Object.assign directly.
      [
        'transform-object-rest-spread',
        {
          // For a node project we can rely on native Object.assign, else it will
          // need to be polyfilled.
          useBuiltIns: isTargettingNode,
        },
      ],

      // function (
      //   arg1,
      //   arg2,
      // ) { }
      'syntax-trailing-function-commas',

      // class { handleThing = () => { } }
      'transform-class-properties',

      isTargettingWeb || usingWebpackAsCompiler
        ? // Adds syntax support for import()
          'babel-plugin-syntax-dynamic-import'
        : // Compiles import() to a deferred require()
          'babel-plugin-dynamic-import-node',

      // Polyfills the runtime needed for async/await and generators.
      onlyIf(isTargettingWeb, 'babel-plugin-transform-runtime'),

      // Replaces the React.createElement function with one that is
      // more optimized for production.
      // NOTE: Relies on Symbol being available.
      onlyIf(env === 'production', 'transform-react-inline-elements'),

      // Hoists element creation to the top level for subtrees that
      // are fully static, which reduces call to React.createElement
      // and the resulting allocations. More importantly, it tells
      // React that the subtree hasn’t changed so React can completely
      // skip it when reconciling.
      onlyIf(env === 'production', 'transform-react-constant-elements'),

      // Removes PropTypes code as it's just dead weight for a production build.
      onlyIf(env === 'production', 'babel-plugin-transform-react-remove-prop-types'),

      // The following two plugins are currently necessary to make React warnings
      // include more valuable information. They are included here because they are
      // currently not enabled in babel-preset-react. See the below threads for more info:
      // https://github.com/babel/babel/issues/4702
      // https://github.com/babel/babel/pull/3540#issuecomment-228673661
      // https://github.com/facebookincubator/create-react-app/issues/989

      // Adds __self attribute to JSX which React will use for some warnings
      onlyIf(env === 'development' || env === 'test', 'transform-react-jsx-self'),

      // Adds component stack to warning messages
      onlyIf(env === 'development' || env === 'test', 'transform-react-jsx-source'),

      // If we are transpiling a node project then we inject some code to
      // include source maps support on the transpiled code.  Don't do this
      // if webpack is being used as a transpiler as it will inline sourcemap
      // support.
      onlyIf(
        isTargettingNode && usingWebpackAsCompiler,
        path.resolve(__dirname, './plugins/sourceMapSupport.js')
      ),
    ]),
  }

  const babelPlugin = R.path(['plugins', 'babel'], project)

  return babelPlugin ? babelPlugin(babelConfig, { project }) : babelConfig
}
