const R = require('ramda')
const path = require('path')
const fs = require('fs-extra')
const TerminalUtils = require('constellate-dev-utils/terminal')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const BabelUtils = require('../babel')
const WebpackUtils = require('../webpack')

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(projects, project, options = {}) {
  TerminalUtils.verbose(`Building ${project.name}`)

  const versions = process.env.NODE_ENV === 'development'
    ? // Explicity set each version as being a development version
      projects.reduce((acc, cur) => Object.assign(acc, { [cur.name]: '0.0.0-development' }), {})
    : options.versions

  if (
    !versions ||
    !R.allPass(
      [projectName => R.find(R.equals(projectName), Object.keys(versions))],
      projects.map(R.prop('name')),
    )
  ) {
    TerminalUtils.error(
      'When creating a production build all version numbers should be provided for each project',
    )
    process.exit(1)
  }

  // :: string -> Project
  const findProject = projectName => R.find(R.propEq('name', projectName), projects)

  // :: string -> string
  const getPackageName = projectName =>
    R.pipe(
      findProject,
      R.path(['paths', 'packageJson']),
      x => readPkg.sync(x, { normalize: false }),
      R.prop('name'),
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
      TerminalUtils.verbose(`Linked ${dependencyName} to ${project.name}`)
    })

    // Create a package.json file for the build of the project
    const sourcePkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })
    const buildPkgJson = Object.assign({}, sourcePkgJson, {
      engines: {
        node: `>=${project.config.nodeVersion}`,
      },
      version: versions[project.name],
      dependencies: Object.assign(
        {},
        (project.config.dependencies || []).reduce(
          (acc, dependencyName) =>
            Object.assign(acc, {
              [getPackageName(dependencyName)]: `^${versions[dependencyName]}`,
            }),
          {},
        ),
        sourcePkgJson.dependencies || {},
      ),
      main: 'modules/index.js',
      files: ['modules'],
    })
    writePkg.sync(project.paths.buildRoot, buildPkgJson)

    // Sym link the node_modules directory from the project's source directory
    // into the build directory for the project. This way we don't need to
    // reinstall the dependencies.
    if (fs.existsSync(project.paths.nodeModules)) {
      fs.ensureSymlinkSync(
        project.paths.nodeModules,
        path.resolve(project.paths.buildRoot, './node_modules'),
      )
    }

    // Finally bundle/transpile the source
    if (project.config.target === 'web' || R.path(['config', 'compiler'], project) === 'webpack') {
      TerminalUtils.verbose(`Bundling ${project.name}`)
      return WebpackUtils.bundle(project)
    }
    TerminalUtils.verbose(`Transpiling ${project.name}`)
    return BabelUtils.transpile(project)
  }

  TerminalUtils.info(`Building ${project.name}`)

  return packageBasedBuild()
    .then(() => {
      TerminalUtils.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      TerminalUtils.error(`Build failed for ${project.name}`)
      throw err
    })
}
