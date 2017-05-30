const R = require('ramda')
const fs = require('fs-extra')
const path = require('path')
const terminal = require('constellate-dev-utils/terminal')

module.exports = function link(projects) {
  const createLinksForProject = (project) => {
    project.dependencies.forEach((dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), projects)

      // Create a sym link
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
