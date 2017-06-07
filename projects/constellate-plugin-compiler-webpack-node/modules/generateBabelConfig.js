/**
 * Tons of inspiration taken from Facebook's superb Create React App project
 * https://github.com/facebookincubator/create-react-app
 * ❤️
 */

const path = require('path')
const R = require('ramda')
const semver = require('semver')
const { removeNil } = require('constellate-dev-utils/modules/arrays')
const { onlyIf } = require('constellate-dev-utils/modules/logic')

// :: Options -> BabelConfig
module.exports = function generateBabelConfig(project) {
  const env = process.env.BABEL_ENV || process.env.NODE_ENV

  const targetNodeVersion =
    R.path(['config', 'compilerOptions', 'nodeVersion'], project) || process.versions.node

  return {
    babelrc: false,

    // Handy for sourcemaps generation.
    sourceRoot: project.paths.modules,

    // Webpack has our back.
    sourceMaps: false,

    presets: [
      [
        'env',
        {
          targets: {
            node: targetNodeVersion,
          },
          // Transpilation of es-modules are handled by webpack.
          modules: false,
        },
      ],
      // jsx && flow support
      'react',
    ],

    plugins: removeNil([
      // const { foo, ...others } = object
      // object = { foo, ...others }
      // This plugin uses Object.assign directly.
      [
        'transform-object-rest-spread',
        {
          // For a node project we can rely on native Object.assign, else it will
          // need to be polyfilled.
          useBuiltIns: semver.major(targetNodeVersion) >= 6,
        },
      ],

      // function (
      //   arg1,
      //   arg2,
      // ) { }
      'syntax-trailing-function-commas',

      // class { handleThing = () => { } }
      'transform-class-properties',

      // Compiles import() to a deferred require()
      'babel-plugin-dynamic-import-node',

      // Polyfills the runtime needed for async/await and generators.
      // async/await exists in Node 7.6.0 upwards
      onlyIf(semver.lt(targetNodeVersion, '7.6.0'), 'babel-plugin-transform-runtime'),

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
    ]),
  }
}
