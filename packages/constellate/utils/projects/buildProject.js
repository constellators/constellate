const R = require('ramda')
const path = require('path')
const fs = require('fs-extra')
const TerminalUtils = require('constellate-dev-utils/terminal')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const BabelUtils = require('../babel')
const WebpackUtils = require('../webpack')
const createSymLinks = require('./createSymLinks')
const getAllProjects = require('./getAllProjects')
const getPackageName = require('./getPackageName')

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(project, options = {}) {
  TerminalUtils.verbose(`Building ${project.name}`)

  const allProjects = getAllProjects()

  const versions = process.env.NODE_ENV === 'development'
    ? // Explicity set each version as being a development version
      allProjects.reduce((acc, cur) => Object.assign(acc, { [cur.name]: '0.0.0-development' }), {})
    : options.versions

  if (
    !versions ||
    !R.allPass(
      [projectName => R.find(R.equals(projectName), Object.keys(versions))],
      allProjects.map(R.prop('name')),
    )
  ) {
    TerminalUtils.error(
      'When creating a production build all version numbers should be provided for each project',
    )
    process.exit(1)
  }

  createSymLinks(project)

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

  function executeBuild() {
    if (project.config.target === 'web' || R.path(['config', 'compiler'], project) === 'webpack') {
      TerminalUtils.verbose(`Bundling ${project.name}`)
      return WebpackUtils.bundle(project)
    }
    TerminalUtils.verbose(`Transpiling ${project.name}`)
    return BabelUtils.transpile(project)
  }

  TerminalUtils.info(`Building ${project.name}...`)

  return executeBuild()
    .then(() => {
      TerminalUtils.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      TerminalUtils.error(`Build failed for ${project.name}`)
      throw err
    })
}
