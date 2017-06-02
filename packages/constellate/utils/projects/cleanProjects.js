const fs = require('fs-extra')
const TerminalUtils = require('constellate-dev-utils/terminal')

module.exports = function cleanProjects(projects) {
  projects.forEach((project) => {
    if (fs.existsSync(project.paths.nodeModules)) {
      TerminalUtils.verbose(`Removing node_modules for ${project.name}`)
      fs.removeSync(project.paths.nodeModules)
    }
  })
}
