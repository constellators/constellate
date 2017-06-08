const R = require('ramda')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = function getAllBundledDependencies(project) {
  const allProjects = ProjectUtils.getAllProjects()
  return R.pipe(
    R.chain(R.pipe(x => allProjects[x], R.prop('allDependants'))),
    R.concat(R.path(['config', 'compilerOptions', 'bundledDependencies'], project) || []),
    R.uniq,
  )(R.path(['config', 'compilerOptions', 'bundledDependencies'], project) || [])
}
