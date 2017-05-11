const fs = require('fs-extra')
const terminal = require('constellate-utils/terminal')
const transpileProject = require('../babel/transpileProject')
const bundle = require('../webpack/bundle')

function packageBasedBuild(project) {
  switch (project.config.target) {
    case 'browser':
      return bundle({ project })
    // DEFAULT: BABEL
    default:
      return transpileProject({ project })
  }
}

// :: Project -> Promise<UnitOfWork>
module.exports = function buildProject({ project }) {
  return terminal.unitOfWork({
    work: () => {
      if (fs.existsSync(project.paths.dist)) {
        fs.removeSync(project.paths.dist)
      }
      return packageBasedBuild(project)
    },
    text: `Building ${project.name}`,
    successText: `Built ${project.name}`,
    errorText: `Failed to build ${project.name}`,
    logError: true,
    displayAsStatus: true,
  })
}
