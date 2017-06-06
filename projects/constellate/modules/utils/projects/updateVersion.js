const fs = require('fs-extra')
const loadJsonFile = require('load-json-file')
const writeJsonFile = require('write-json-file')

module.exports = function updateVersion(project, version) {
  const updateJsonFile = (file) => {
    const pkgJson = loadJsonFile.sync(file)
    // We do the version on both sides to make sure version is at top of
    // file with the correct new value also.
    const newPkgJson = Object.assign({ version }, pkgJson, { version })
    writeJsonFile.sync(file, newPkgJson)
  }
  updateJsonFile(project.paths.packageJson)
  if (fs.existsSync(project.paths.packageLockJson)) {
    updateJsonFile(project.paths.packageLockJson)
  }
}
