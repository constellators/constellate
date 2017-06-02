const path = require('path')
const fs = require('fs-extra')
const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/terminal')

module.exports = function createLinksForProject(projects, project) {
  project.dependencies.forEach((dependencyName) => {
    const dependency = R.find(R.propEq('name', dependencyName), projects)

    // Create a sym link
    const target = path.resolve(project.paths.nodeModules, `./${dependency.name}`)
    if (fs.existsSync(target)) {
      fs.removeSync(target)
    }
    fs.ensureSymlinkSync(dependency.paths.buildRoot, target)

    TerminalUtils.success(`Linked ${dependencyName} to ${project.name}`)
  })
}
