/* eslint-disable global-require */

const dedent = require('dedent')
const chalk = require('chalk')
const R = require('ramda')
const FSUtils = require('../../fs')

const compilerPluginCache = {}

const resolveCustomPlugin = (pluginName) => {
  const fullPluginName = pluginName.startsWith('constellate-plugin-compiler-')
    ? pluginName
    : `constellate-plugin-compiler-${pluginName}`
  const simplePluginName = fullPluginName.replace('constellate-plugin-compiler-', '')

  if (compilerPluginCache[simplePluginName]) {
    return compilerPluginCache[simplePluginName]
  }

  const plugin = FSUtils.resolvePackage(fullPluginName)

  if (!plugin) {
    throw new Error(
      dedent(`
        Could not resolve "${pluginName}" compiler. Make sure you have the plugin installed:

            ${chalk.blue('npm install -D')} ${chalk.green(fullPluginName)}
      `),
    )
  }

  compilerPluginCache[simplePluginName] = plugin
  return plugin
}

module.exports = function resolveCompilerPlugin(pluginName) {
  if (R.isEmpty(pluginName) || R.isNil(pluginName)) {
    throw new Error('No plugin name was given to resolveCompilerPlugin')
  }
  if (pluginName === 'none') {
    return require('./none')
  }

  return resolveCustomPlugin(pluginName)
}
