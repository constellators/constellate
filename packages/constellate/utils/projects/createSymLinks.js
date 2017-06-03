const fs = require('fs-extra')
const R = require('ramda')
const path = require('path')
const TerminalUtils = require('constellate-dev-utils/terminal')
const getPackageName = require('./getPackageName')
const getAllProjects = require('./getAllProjects')

/**
 * Create symlinks for each of the constellate projects that are marked as
 * dependencies for this project. For us to have gotten here they should
 * have all been built already.  We can therefore symlink the build folder
 * for each respective dependency into the node_modules directory for the
 * project we are about to build. This will make sure any possible bundling
 * will succeed.
 *
 * @param  {Project} project The project
 *
 * @return {void}
 */
module.exports = function createSymLinks(project) {
  const allProjects = getAllProjects()

  project.dependencies.forEach((dependencyName) => {
    const dependency = R.find(R.propEq('name', dependencyName), allProjects)
    const target = path.resolve(project.paths.nodeModules, `./${getPackageName(dependency.name)}`)
    if (fs.existsSync(target)) {
      fs.removeSync(target)
    }
    fs.ensureSymlinkSync(dependency.paths.buildRoot, target)
    TerminalUtils.verbose(`Linked ${dependencyName} to ${project.name}`)
  })
}
