const R = require('ramda')
const readPkg = require('read-pkg')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const getAllBundledDependencies = require('constellate-dev-utils-webpack/modules/getAllBundledDependencies')
const bundle = require('./bundle')

module.exports = {
  compile: bundle,

  prePublishToNPM: (project) => {
    const allProjects = ProjectUtils.getAllProjects()
    // When doing a webpack bundled project we need to include all the npm
    // dependencies from our constellate dependencies as we will inline
    // bundle all our constellate dependencies.
    getAllBundledDependencies(project).reduce((acc, dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), allProjects)
      const pkgJson = readPkg.sync(dependency.paths.packageJson, { normalize: false })
      return Object.assign(acc, pkgJson.dependencies || {})
    }, {})
  },
}
