const { TerminalUtils } = require('constellate-dev-utils')

module.exports = function createProjectDevelopConductor(project, watcher) {
  let runningDevelopInstance

  return {
    // :: void -> Promise
    start: () => {
      TerminalUtils.verbose(
        `Starting develop implementation for ${project.name}`,
      )

      if (!project.plugins.developPlugin) {
        throw new Error(
          `Trying to run develop plugin on project without one specified: ${
            project.name
          }`,
        )
      }

      return project.plugins.developPlugin
        .develop(watcher)
        .then(developInstance => {
          runningDevelopInstance = developInstance
        })
    },

    // :: void -> Promise
    stop: () =>
      runningDevelopInstance
        ? runningDevelopInstance.kill()
        : Promise.resolve(),
  }
}
