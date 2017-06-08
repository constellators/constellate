const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const serverDevelop = require('./serverDevelop')

module.exports = function createProjectDevelopConductor(project, watcher) {
  let runningDevelopInstance

  return {
    // :: void -> Promise
    start: () => {
      // Just in case a custom process is run we will link our project here.
      ProjectUtils.linkProject(project)

      // If the project is using a compiler that has a custom develop
      // implementation then we shall use that.
      if (project.compiler && project.compiler.develop) {
        TerminalUtils.verbose(`Starting custom develop implementation for ${project.name}`)
        return project.compiler.develop(project, watcher).then((developInstance) => {
          runningDevelopInstance = developInstance
        })
      }

      // If the project has been configured as being a "server" type then
      // we will create a server develop instance.
      if (project.config.role === 'server') {
        TerminalUtils.verbose(`Starting "server" role develop instance for ${project.name}`)
        return serverDevelop(project, watcher).then((developInstance) => {
          runningDevelopInstance = developInstance
        })
      }

      // Else the project is likely just a library type and so we shall just
      // compile it.
      TerminalUtils.verbose(`Doing simple compile for develop of ${project.name}`)
      return ProjectUtils.compileProject(project)
    },

    // :: void -> Promise
    stop: () => (runningDevelopInstance ? runningDevelopInstance.kill() : Promise.resolve()),
  }
}
