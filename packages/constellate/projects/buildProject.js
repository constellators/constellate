const R = require('ramda')

const terminal = require('constellate-utils/terminal')

const transpile = require('../babel/transpile')
const bundle = require('../webpack/bundle')

function packageBasedBuild(project) {
  if (project.config.target === 'web' || R.path(['config', 'compiler'], project) === 'webpack') {
    terminal.verbose(`Bundling ${project.name}`)
    return bundle(project)
  }
  terminal.verbose(`Transpiling ${project.name}`)
  return transpile(project)
}

// :: Project -> Promise<BuildResult>
module.exports = function buildProject(project) {
  terminal.verbose(`Building ${project.name}`)

  return packageBasedBuild(project)
    .then(() => {
      terminal.success(`Built ${project.name}`)
    })
    .catch((err) => {
      terminal.error(`Build failed for ${project.name}`)
      throw err
    })
}
