const R = require('ramda')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = function getAllBundledDependencies(project) {
  const allProjects = ProjectUtils.getAllProjects()
  return R.pipe(
    R.chain(R.pipe(x => allProjects[x], R.prop('allDependants'))),
    R.concat(project.bundledDependencies),
    R.uniq,
  )(project.bundledDependencies)
}
