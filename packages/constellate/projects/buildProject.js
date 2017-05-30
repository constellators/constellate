const R = require('ramda')
const path = require('path')
const fs = require('fs-extra')
const terminal = require('constellate-dev-utils/terminal')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const semver = require('semver')
const transpile = require('../babel/transpile')
const bundle = require('../webpack/bundle')
const createLinksForProject = require('./createLinksForProject')

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(projects, project) {
  terminal.verbose(`Building ${project.name}`)

  const findProject = projectName => R.find(R.propEq('name', projectName), projects)

  function packageBasedBuild() {
    // Create symlinks of (built) dependencies into the source node_modules for
    // the project.
    createLinksForProject(projects, project)

    // Create the package.json file in build output
    const sourcePkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })
    const buildPkgJson = Object.assign({}, sourcePkgJson, {
      dependencies: Object.assign(
        {},
        (project.config.dependencies || [])
          .reduce(
            (acc, dependencyName) =>
              Object.assign(
                acc,
                R.pipe(
                  findProject,
                  R.path(['paths', 'packageJson']),
                  x => readPkg.sync(x, { normalize: false }),
                  R.prop('dependencies'),
                  R.defaultTo({}),
                )(dependencyName),
              ),
            {},
          ),
        sourcePkgJson.dependencies || {},
      ),
      main: 'modules/index.js',
      files: ['modules'], // .concat(project.packageDependenciesAsLocalFiles ? ['local_modules'] : []),
    })
    writePkg.sync(project.paths.buildRoot, buildPkgJson)

    // Sym link source node_modules to the build package
    fs.ensureSymlinkSync(
      project.paths.nodeModules,
      path.resolve(project.paths.buildRoot, './node_modules'),
    )

    // Create sym links for dependencies if packageDependenciesAsLocalFiles
    if (project.packageDependenciesAsLocalFiles) {
      (project.config.dependencies || []).forEach((dependencyName) => {
        fs.ensureSymlinkSync(
          findProject(dependencyName).paths.buildRoot,
          path.resolve(project.paths.buildModules, `./node_modules/${dependencyName}`),
        )
      })
    }

    // Finally bundle/transpile the source
    if (project.config.target === 'web' || R.path(['config', 'compiler'], project) === 'webpack') {
      terminal.verbose(`Bundling ${project.name}`)
      return bundle(project)
    }
    terminal.verbose(`Transpiling ${project.name}`)
    return transpile(project)
  }

  return packageBasedBuild()
    .then(() => {
      terminal.success(`Built ${project.name}`)
    })
    .catch((err) => {
      terminal.error(`Build failed for ${project.name}`)
      throw err
    })
}
