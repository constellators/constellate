const fs = require('fs-extra')
const terminal = require('constellate-utils/terminal')
const transpileProject = require('../babel/transpileProject')
const bundle = require('../webpack/bundle')

function packageBasedBuild(project) {
  if (project.config.browser) {
    return bundle({ project })
  }
  return transpileProject({ project })
}

// :: Project -> Promise<UnitOfWork>
module.exports = function buildProject(project) {
  terminal.info(`Building ${project.name}`)
  // if (fs.existsSync(project.paths.dist)) {
  //   terminal.verbose(`Removing dist dir for ${project.name}`)
  //   fs.removeSync(project.paths.dist)
  // }
  return packageBasedBuild(project)
    .then(() => terminal.success(`Built ${project.name}`))
    .catch(() => terminal.error(`Failed to build ${project.name}`))
}
