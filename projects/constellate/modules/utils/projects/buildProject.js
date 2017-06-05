const fs = require('fs-extra')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const BabelUtils = require('../babel')
const WebpackUtils = require('../webpack')
const createSymLinks = require('./createSymLinks')
const createPkgJson = require('./createPkgJson')

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(project, options = {}) {
  createSymLinks(project)
  createPkgJson(project, { versions: options.versions })

  function executeBuild() {
    const compiler = project.config.compiler

    if (compiler === 'none') {
      TerminalUtils.verbose(`Not compiling ${project.name}`)
      fs.ensureSymlinkSync(project.paths.modules, project.paths.buildModules)
      return Promise.resolve()
    }
    if (compiler === 'webpack' || compiler === 'webpack-node') {
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
