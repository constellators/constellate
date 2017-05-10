const fs = require('fs-extra')
const transpileProject = require('constellate-babel/transpileProject')
const bundle = require('constellate-webpack/bundle')

function packageBasedBuild(project) {
  switch (project.config.target) {
    case 'browser':
      return bundle({ project })
    // DEFAULT: BABEL
    default:
      return transpileProject({ project })
  }
}

// :: Project -> Promise<BuildResult>
module.exports = function buildProject({ project }) {
  if (fs.existsSync(project.paths.dist)) {
    fs.removeSync(project.paths.dist)
  }
  return packageBasedBuild(project)
    .then(() => ({ project, success: true }))
    .catch(err => ({ project, success: false, err }))
}
