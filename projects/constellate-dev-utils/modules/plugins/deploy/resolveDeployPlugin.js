/* eslint-disable global-require */

const dedent = require('dedent')
const chalk = require('chalk')
const R = require('ramda')

const FSUtils = require('../../fs')

const deployPluginCache = {}

const resolveCustomPlugin = (pluginName) => {
  const fullPluginName = pluginName.startsWith('constellate-plugin-deploy-')
    ? pluginName
    : `constellate-plugin-deploy-${pluginName}`
  const simplePluginName = fullPluginName.replace('constellate-plugin-deploy-', '')

  if (deployPluginCache[simplePluginName]) {
    return deployPluginCache[simplePluginName]
  }

  const plugin = FSUtils.resolvePackage(fullPluginName)

  if (!plugin) {
    throw new Error(
      dedent(`
        Could not resolve "${pluginName}" deploy plugin. Make sure you have the plugin installed:

            ${chalk.blue('npm install -D')} ${chalk.green(fullPluginName)}
      `),
    )
  }

  deployPluginCache[simplePluginName] = plugin
  return plugin
}

module.exports = function resolveDeployPlugin(pluginName) {
  if (R.isEmpty(pluginName) || R.isNil(pluginName)) {
    throw new Error('No plugin name was given to resolveDeployPlugin')
  }
  return resolveCustomPlugin(pluginName)
}
