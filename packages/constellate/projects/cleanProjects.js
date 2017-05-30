const fs = require('fs-extra')
const terminal = require('constellate-dev-utils/terminal')

module.exports = function cleanProjects(projects) {
  projects.forEach((project) => {
    if (fs.existsSync(project.paths.nodeModules)) {
      terminal.verbose(`Removing node_modules for ${project.name}`)
      fs.removeSync(project.paths.nodeModules)
    }
  })
}
