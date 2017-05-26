const R = require('ramda')
const fs = require('fs-extra')
const path = require('path')
const terminal = require('constellate-dev-utils/terminal')

module.exports = function link(projects) {
  const createLinksForProject = (project) => {
    if (
      !project.config.constellateDependencies ||
      project.config.constellateDependencies.length === 0
    ) {
      // nada
      return
    }
    project.config.constellateDependencies.forEach((dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), projects)
      if (!dependency) {
        terminal.warning(`Could not find dependency ${dependencyName} for ${project.name}`)
        return
      }
      const target = path.resolve(project.paths.nodeModules, `./${dependency.name}`)
      if (fs.existsSync(target)) {
        fs.removeSync(target)
      }
      fs.ensureSymlinkSync(dependency.paths.root, target)
      terminal.success(`Linked ${dependencyName} to ${project.name}`)
    })
  }

  projects.forEach(createLinksForProject)
}
