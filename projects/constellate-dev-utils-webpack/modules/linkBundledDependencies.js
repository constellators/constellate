const { EOL } = require('os')
const path = require('path')
const fs = require('fs-extra')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const getAllBundledDependencies = require('./getAllBundledDependencies')

module.exports = function linkBundledDependencies(project) {
  const allProjects = ProjectUtils.getAllProjects()

  // We need to symlink each NPM dependency of each of our bundled dependencies
  // into the node_modules dir of our project.
  getAllBundledDependencies(project).forEach((dependencyName) => {
    const dependency = allProjects[dependencyName]

    const pkgJson = readPkg.sync(dependency.paths.packageJson, { normalize: false })
    if (!pkgJson.dependencies) {
      TerminalUtils.verbose(
        `No npm dependencies to link from ${dependency.name} to ${project.name}`,
      )
      return
    }

    Object.keys(pkgJson.dependencies).forEach((npmDepName) => {
      const from = path.resolve(dependency.paths.nodeModules, `./${npmDepName}`)
      const to = path.resolve(project.paths.nodeModules, `./${npmDepName}`)
      TerminalUtils.verbose(
        `Linking npm dependency ${npmDepName} to ${project.name}${EOL}\t${from} -> ${to}`,
      )
      try {
        fs.ensureSymlinkSync(from, to)
      } catch (err) {
        TerminalUtils.error(
          `Failed to link dependency for bundling: ${from}${EOL}Please check to see if it exists`,
          err,
        )
        process.exit(1)
      }
    })
  })
}
