/* eslint-disable global-require */

const dedent = require('dedent')
const chalk = require('chalk')
const R = require('ramda')
const FSUtils = require('../../fs')

const buildPluginCache = {}

const resolveCustomPlugin = (pluginName) => {
  const fullPluginName = pluginName.startsWith('constellate-plugin-build-')
    ? pluginName
    : `constellate-plugin-build-${pluginName}`
  const simplePluginName = fullPluginName.replace('constellate-plugin-build-', '')

  if (buildPluginCache[simplePluginName]) {
    return buildPluginCache[simplePluginName]
  }

  const plugin = FSUtils.resolvePackage(fullPluginName)

  if (!plugin) {
    throw new Error(
      dedent(`
        Could not resolve "${pluginName}" build plugin. Make sure you have the plugin installed:

            ${chalk.blue('npm install -D')} ${chalk.green(fullPluginName)}
      `),
    )
  }

  buildPluginCache[simplePluginName] = plugin
  return plugin
}

module.exports = function resolveBuildPlugin(pluginName) {
  if (R.isEmpty(pluginName) || R.isNil(pluginName)) {
    throw new Error('No plugin name was given to resolveBuildPlugin')
  }
  if (pluginName === 'none') {
    return require('./none')
  }

  return resolveCustomPlugin(pluginName)
}
