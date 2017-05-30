const fs = require('fs-extra')

const terminal = require('constellate-dev-utils/terminal')

// TODO: Refactor based on new folder structure. just need to delete build
module.exports = function cleanProjects(projects) {
  projects.forEach((project) => {
    if (fs.existsSync(project.paths.buildModules)) {
      terminal.verbose(`Removing build for ${project.name}`)
      fs.removeSync(project.paths.buildModules)
    }
    if (fs.existsSync(project.paths.webpackCache)) {
      terminal.verbose(`Removing webpack cache for ${project.name}`)
      fs.removeSync(project.paths.webpackCache)
    }
  })
}
