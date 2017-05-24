const fs = require('fs-extra')

const terminal = require('constellate-utils/terminal')

module.exports = function cleanProjects(projects) {
  projects.forEach((project) => {
    if (fs.existsSync(project.paths.dist)) {
      terminal.verbose(`Removing dist for ${project.name}`)
      fs.removeSync(project.paths.dist)
    }
    if (fs.existsSync(project.paths.webpackCache)) {
      terminal.verbose(`Removing webpack cache for ${project.name}`)
      fs.removeSync(project.paths.webpackCache)
    }
  })
}
