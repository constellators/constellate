//      

                                                        

const fs = require('fs-extra')
const loadJsonFile = require('load-json-file')
const writeJsonFile = require('write-json-file')
const getAllProjectsArray = require('./getAllProjectsArray')

module.exports = function updateVersions(project         , versions                 )       {
  const allProjectsArray = getAllProjectsArray()

  const updateJsonFile = (file) => {
    const pkgJson = loadJsonFile.sync(file)

    const projectVersion = { version: versions[project.name] }

    const createUpdatedDependencies = type =>
      pkgJson[type]
        ? Object.assign(
            {},
            pkgJson[type],
            Object.keys(pkgJson[type]).reduce((acc, cur) => {
              const match = allProjectsArray.find(x => x.packageName === cur)
              if (match && versions[match.name]) {
                return Object.assign(acc, { [cur]: versions[match.name] })
              }
              return acc
            }, {}),
          )
        : undefined

    // We do the version on both sides to make sure version is at top of
    // file with the correct new value also.
    const newPkgJson = Object.assign({}, projectVersion, pkgJson, projectVersion, {
      dependencies: createUpdatedDependencies('dependencies'),
      devDependencies: createUpdatedDependencies('devDependencies'),
    })
    writeJsonFile.sync(file, newPkgJson)
  }
  updateJsonFile(project.paths.packageJson)
  if (fs.existsSync(project.paths.packageLockJson)) {
    updateJsonFile(project.paths.packageLockJson)
  }
}
