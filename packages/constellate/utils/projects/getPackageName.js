const R = require('ramda')
const readPkg = require('read-pkg')
const getAllProjects = require('./getAllProjects')

module.exports = function getPackageName(projectName) {
  const allProjects = getAllProjects()
  const project = R.find(R.propEq('name', projectName), allProjects)

  // :: string -> string
  return R.pipe(
    R.path(['paths', 'packageJson']),
    x => readPkg.sync(x, { normalize: false }),
    R.prop('name'),
  )(project)
}
