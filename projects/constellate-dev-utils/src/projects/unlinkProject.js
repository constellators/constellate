const fs = require('fs-extra')
const path = require('path')
const TerminalUtils = require('../terminal')
const getAllProjects = require('./getAllProjects')

module.exports = function unlinkProject(project) {
  const allProjects = getAllProjects()

  // Sym link our the build root for each of the project's dependencies into the
  // node_modules directory for the project. That way our project resolved the
  // latest local build for each of it's dependencies.
  ;[...project.dependencies, ...project.devDependencies].forEach((dependencyName) => {
    const target = path.resolve(
      project.paths.nodeModules,
      `./${allProjects[dependencyName].packageName}`,
    )
    if (fs.existsSync(target)) {
      fs.removeSync(target)
      TerminalUtils.verbose(`Unlinked ${dependencyName} from ${project.name}`)
    } else {
      TerminalUtils.verbose(
        `Did not need to unlinked ${dependencyName} from ${project.name} as no symlink existed`,
      )
    }
  })
}
