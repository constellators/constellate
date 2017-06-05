const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const BabelUtils = require('../babel')
const WebpackUtils = require('../webpack')

const executeBuild = (project) => {
  const compiler = project.config.compiler

  // Raw
  if (compiler === 'none') {
    TerminalUtils.verbose(`Not compiling ${project.name}`)
    return Promise.resolve()
  }

  // Webpack
  if (compiler === 'webpack' || compiler === 'webpack-node') {
    TerminalUtils.verbose(`Bundling ${project.name}`)
    return WebpackUtils.bundle(project)
  }

  // Babel
  TerminalUtils.verbose(`Transpiling ${project.name}`)
  return BabelUtils.transpile(project)
}

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(project) {
  TerminalUtils.info(`Building ${project.name}...`)
  return executeBuild(project)
    .then(() => {
      TerminalUtils.verbose(`Built ${project.name}`)
    })
    .catch((err) => {
      TerminalUtils.error(`Build failed for ${project.name}`)
      throw err
    })
}
