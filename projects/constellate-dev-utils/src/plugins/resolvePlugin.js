/* eslint-disable global-require */
const dedent = require('dedent')
const chalk = require('chalk')
const R = require('ramda')
const FSUtils = require('../fs')

const pluginCache = {}

module.exports = pluginName => {
  if (R.isEmpty(pluginName) || R.isNil(pluginName)) {
    throw new Error('No plugin name was given to resolvePlugin')
  }

  switch (pluginName) {
    case 'develop-build':
      return require('./develop/build')
    case 'develop-server':
      return require('./develop/server')
    case 'develop-script':
      return require('./develop/script')
    default:
    // Do nothing, fall through and resolve custom plugin...
  }

  const fullPluginName = pluginName.startsWith('constellate-plugin-')
    ? pluginName
    : `constellate-plugin-${pluginName}`

  if (pluginCache[fullPluginName]) {
    return pluginCache[fullPluginName]
  }

  const plugin = FSUtils.resolvePackage(fullPluginName)

  if (!plugin) {
    throw new Error(
      dedent(`
        Could not resolve "${pluginName}" plugin. Make sure you have the plugin installed:

            ${chalk.blue('npm install -D')} ${chalk.green(fullPluginName)}
      `),
    )
  }

  pluginCache[fullPluginName] = plugin
  return plugin
}
