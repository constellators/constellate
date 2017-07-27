/* eslint-disable global-require */

const dedent = require('dedent')
const chalk = require('chalk')
const FSUtils = require('../../fs')

const developPluginCache = {}

const resolveCustomPlugin = (pluginName) => {
  const fullPluginName = pluginName.startsWith('constellate-plugin-develop-')
    ? pluginName
    : `constellate-plugin-develop-${pluginName}`
  const simplePluginName = fullPluginName.replace('constellate-plugin-develop-', '')

  if (developPluginCache[simplePluginName]) {
    return developPluginCache[simplePluginName]
  }

  const plugin = FSUtils.resolvePackage(fullPluginName)

  if (!plugin) {
    throw new Error(
      dedent(`
        Could not resolve "${pluginName}" develop plugin. Make sure you have the plugin installed:

            ${chalk.blue('npm install -D')} ${chalk.green(fullPluginName)}
      `),
    )
  }

  developPluginCache[simplePluginName] = plugin
  return plugin
}

module.exports = function resolveDevelopPlugin(pluginName) {
  switch (pluginName) {
    case 'build':
      return require('./build')
    case 'server':
      return require('./server')
    case 'script':
      return require('./script')
    default:
      return resolveCustomPlugin(pluginName)
  }
}
