const readPkg = require('read-pkg')
const writePkg = require('write-pkg')

module.exports = function updateVersion(project, version) {
  const pkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })
  // We do the version on both sides to make sure version is at top of
  // file with the correct new value also.
  const newPkgJson = Object.assign({ version }, pkgJson, { version })
  writePkg.sync(project.paths.packageJson, newPkgJson)
}
