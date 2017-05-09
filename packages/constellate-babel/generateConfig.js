const path = require('path')
const removeNil = require('constellate-utils/arrays/removeNil')
const ifElse = require('constellate-utils/logic/ifElse')

// :: Options -> BabelConfig
module.exports = function generateConfig({ packageInfo }) {
  const isNodeTarget = packageInfo.target === 'node'
  const isBrowserTarget = packageInfo.target === 'browser'
  const ifNodeTarget = ifElse(isNodeTarget)
  const ifBrowserTarget = ifElse(isBrowserTarget)

  return {
    babelrc: false,
    // Source maps will be useful for debugging errors in our node executions.
    sourceRoot: packageInfo.paths.source,
    sourceMaps: ifNodeTarget('both', false),
    presets: [
      // We don't include es-module processing when targetting the browser as
      // webpack will take care of that for us.
      ['env', { es2015: { modules: packageInfo.target !== 'browser' } }],
      'react',
    ],
    plugins: removeNil([
      ifNodeTarget(() => path.resolve(__dirname, './plugins/sourceMapSupport.js')),
      'transform-object-rest-spread',
      'syntax-trailing-function-commas',
      'transform-class-properties',
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
    ]),
  }
}
