const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function createProjectDevelopConductor(project, watcher) {
  let runningDevelopInstance
  let developPluginCache

  return {
    // :: void -> Promise
    start: () => {
      TerminalUtils.verbose(`Starting develop implementation for ${project.name}`)

      if (!developPluginCache) {
        developPluginCache = project.developPlugin(project, project.config.developOptions, watcher)
      }

      return developPluginCache.start().then((developInstance) => {
        runningDevelopInstance = developInstance
      })
    },

    // :: void -> Promise
    stop: () => (runningDevelopInstance ? runningDevelopInstance.kill() : Promise.resolve()),
  }
}
