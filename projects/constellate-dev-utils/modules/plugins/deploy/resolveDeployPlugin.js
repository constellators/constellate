/* eslint-disable global-require */

const dedent = require('dedent')
const chalk = require('chalk')
const FSUtils = require('../../fs')

const developPluginCache = {}

const resolveCustomPlugin = (pluginName) => {
  const fullPluginName = pluginName.startsWith('constellate-plugin-deploy-')
    ? pluginName
    : `constellate-plugin-deploy-${pluginName}`
  const simplePluginName = fullPluginName.replace('constellate-plugin-deploy-', '')

  if (developPluginCache[simplePluginName]) {
    return developPluginCache[simplePluginName]
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

  developPluginCache[simplePluginName] = plugin
  return plugin
}

module.exports = function resolveDeployPlugin(pluginName) {
  return resolveCustomPlugin(pluginName)
}
