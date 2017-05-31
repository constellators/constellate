const R = require('ramda')
const path = require('path')
const fs = require('fs-extra')
const terminal = require('constellate-dev-utils/terminal')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const transpile = require('../babel/transpile')
const bundle = require('../webpack/bundle')
const getAppConfig = require('../app/getAppConfig')

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(projects, project) {
  terminal.verbose(`Building ${project.name}`)

  const constellateAppConfig = getAppConfig()

  // :: string -> Project
  const findProject = projectName => R.find(R.propEq('name', projectName), projects)

  // :: string -> string
  const getPackageName = projectName =>
    R.pipe(
      findProject,
      R.path(['paths', 'packageJson']),
      x => readPkg.sync(x, { normalize: false }),
      R.prop('name')
    )(projectName)

  function packageBasedBuild() {
    // Create symlinks for each of the constellate projects that are marked as
    // dependencies for this project. For us to have gotten here they should
    // have all been built already.  We can therefore symlink the build folder
    // for each respective dependency into the node_modules directory for the
    // project we are about to build. This will make sure any possible bundling
    // will succeed.
    project.dependencies.forEach((dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), projects)
      const target = path.resolve(project.paths.nodeModules, `./${getPackageName(dependency.name)}`)
      if (fs.existsSync(target)) {
        fs.removeSync(target)
      }
      fs.ensureSymlinkSync(dependency.paths.buildRoot, target)
      terminal.verbose(`Linked ${dependencyName} to ${project.name}`)
    })

    // Create a package.json file for the build of the project
    const sourcePkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })
    const buildPkgJson = Object.assign({}, sourcePkgJson, {
      engines: {
        node: `>=${project.config.nodeVersion}`,
      },
      version: constellateAppConfig.version,
      dependencies: Object.assign(
        {},
        (project.config.dependencies || []).reduce(
          (acc, dependencyName) =>
            Object.assign(acc, {
              [getPackageName(dependencyName)]: `^${constellateAppConfig.version}`,
            }),
          {}
        ),
        sourcePkgJson.dependencies || {}
      ),
      main: 'modules/index.js',
      files: ['modules'],
    })
    writePkg.sync(project.paths.buildRoot, buildPkgJson)

    // Sym link the node_modules directory from the project's source directory
    // into the build directory for the project. This way we don't need to
    // reinstall the dependencies.
    fs.ensureSymlinkSync(
      project.paths.nodeModules,
      path.resolve(project.paths.buildRoot, './node_modules')
    )

    // Finally bundle/transpile the source
    if (project.config.target === 'web' || R.path(['config', 'compiler'], project) === 'webpack') {
      terminal.verbose(`Bundling ${project.name}`)
      return bundle(project)
    }
    terminal.verbose(`Transpiling ${project.name}`)
    return transpile(project)
  }

  terminal.info(`Building ${project.name}`)

  return packageBasedBuild()
    .then(() => {
      terminal.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      terminal.error(`Build failed for ${project.name}`)
      throw err
    })
}
