const pSeries = require('p-series')
const cleanBuild = require('./cleanBuild')
const buildProject = require('./buildProject')

// :: void => Promise
module.exports = function buildProjects(projects) {
  // First clear down any existing build
  cleanBuild()

  // :: Project -> void -> Promise
  const queueBuild = project => () => buildProject(projects, project)

  return pSeries(projects.map(queueBuild))
}
