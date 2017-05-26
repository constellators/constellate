const pSeries = require('p-series')
const terminal = require('constellate-dev-utils/terminal')
const buildProjects = require('../projects/buildProjects')

function packageProject(project) {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const packageJson = require(project.paths.packageJson)

  if (packageJson.private && project.dependencies.length > 0) {
    // do "wrapped" packaging
    terminal.verbose(`Creating a "wrapped" package for ${project.name}`)
  } else {
    // do "standard" packaging
    terminal.verbose(`Creating a "standard" package for ${project.name}`)
  }
}

// :: Project -> void -> Promise<Any>
const queuePackaging = project => () => packageProject(project)

module.exports = function packageProjects(projects) {
  return (
    buildProjects(projects)
      // then package each one in series
      .then(() => pSeries(projects.map(queuePackaging)))
  )
}
