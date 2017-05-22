const path = require('path')
const R = require('ramda')

const removeNil = require('constellate-utils/arrays/removeNil')
const ifElse = require('constellate-utils/logic/ifElse')

// :: Options -> BabelConfig
module.exports = function generateConfig(project, options = {}) {
  const { development = false } = options

  const isNode = !project.config.server //  === 'node'
  const isWeb = !project.config.web //  === 'web'
  const ifNode = ifElse(isNode)
  const ifWeb = ifElse(isWeb)

  const isProd = !development
  const isDev = !!development
  const ifDev = ifElse(isDev)
  const ifProd = ifElse(isProd)

  const babelConfig = {
    babelrc: false,
    // Source maps will be useful for debugging errors in our node executions.
    sourceRoot: project.paths.source,
    sourceMaps: ifNode('both', false),
    presets: [
      // We don't include es-module processing when targetting the web as
      // webpack will take care of that for us.
      ['env', { es2015: { modules: !isWeb } }],
      'react',
    ],
    plugins: removeNil([
      'transform-object-rest-spread',
      'syntax-trailing-function-commas',
      'transform-class-properties',
      // This decorates our components with  __self prop to JSX elements,
      // which React will use to generate some runtime warnings.
      ifDev('transform-react-jsx-self'),
      // Adding this will give us the path to our components in the
      // react dev tools.
      ifDev('transform-react-jsx-source'),
      // Replaces the React.createElement function with one that is
      // more optimized for production.
      // NOTE: Relies on Symbol.
      ifProd('transform-react-inline-elements'),
      // Hoists element creation to the top level for subtrees that
      // are fully static, which reduces call to React.createElement
      // and the resulting allocations. More importantly, it tells
      // React that the subtree hasn’t changed so React can completely
      // skip it when reconciling.
      ifProd('transform-react-constant-elements'),
    ]),
  }

  if (isNode && R.path(['config', 'server', 'compiler'], project) !== 'webpack') {
    babelConfig.plugins = [
      path.resolve(__dirname, './plugins/sourceMapSupport.js'),
      ...babelConfig.plugins,
    ]
  }

  const babelPlugin = R.path(['plugins', 'babel'], project)

  return babelPlugin ? babelPlugin(babelConfig, { project, development }) : babelConfig
}
