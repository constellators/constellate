const fs = require('fs-extra')

const terminal = require('constellate-utils/terminal')

module.exports = function cleanProjects(projects) {
  projects.forEach((project) => {
    if (fs.existsSync(project.paths.build)) {
      terminal.verbose(`Removing build for ${project.name}`)
      fs.removeSync(project.paths.build)
    }
    if (fs.existsSync(project.paths.webpackCache)) {
      terminal.verbose(`Removing webpack cache for ${project.name}`)
      fs.removeSync(project.paths.webpackCache)
    }
  })
}
