const fs = require('fs-extra')
const path = require('path')
const pSeries = require('p-series')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const semver = require('semver')
const terminal = require('constellate-dev-utils/terminal')
const buildProjects = require('../projects/buildProjects')

module.exports = function packageProjects(projects) {
  // First clear down any existing packages build
  const packagesRoot = path.resolve(process.cwd(), './packages')
  if (fs.existsSync(packagesRoot)) {
    fs.removeSync(packagesRoot)
  }

  function packageProject(project) {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const packageJson = require(project.paths.packageJson)

    if (packageJson.private && project.dependencies.length > 0) {
      // do "wrapped" packaging
      terminal.verbose(`Creating a "wrapped" package for ${project.name}`)
    } else {
      // do "standard" packaging
      terminal.verbose(`Creating a "standard" package for ${project.name}`)
    }

    const projectPackageRoot = path.resolve(packagesRoot, project.name)
    fs.ensureDirSync(projectPackageRoot)

    /*
    // Update the peer dependencies
    const pkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })
    const dependencyVersion = semver.valid(pkgJson.version)
    if (!dependencyVersion) {
      throw new Error(
        `${dependencyName} does not have a version assigned within it's package.json file.`
      )
    }
    const newPkgJson = Object.assign({}, pkgJson, {
      peerDependencies: Object.assign({}, pkgJson.peerDependencies || {}, {
        [dependencyName]: `~${dependencyVersion}`,
      }),
    })
    writePkg.sync(project.paths.packageJson, newPkgJson)
    */
  }

  // :: Project -> void -> Promise<Any>
  const queuePackaging = project => () => packageProject(project)

  return (
    buildProjects(projects)
      // then package each one in series
      .then(() => pSeries(projects.map(queuePackaging)))
  )
}
