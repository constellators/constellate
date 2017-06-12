const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = function createProjectDevelopConductor(project, watcher) {
  let runningDevelopInstance
  let developPluginCache

  return {
    // :: void -> Promise
    start: () => {
      TerminalUtils.verbose(`Starting develop implementation for ${project.name}`)

      // Just in case a custom process is run we will link our project here.
      ProjectUtils.linkProject(project)

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
