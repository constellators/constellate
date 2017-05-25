const pSeries = require('p-series')
const buildProject = require('./buildProject')

// :: Project -> void -> Promise
const queueBuild = project => () => buildProject(project)

// :: void => Promise
module.exports = function buildProjects(projects) {
  return pSeries(projects.map(queueBuild))
}
