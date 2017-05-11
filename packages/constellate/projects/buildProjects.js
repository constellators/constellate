const pSeries = require('p-series')
const buildProject = require('./buildProject')

// :: Project -> void -> Promise<Any>
const queueBuild = project => () => buildProject({ project })

// :: void => Promise<Array<BuildResult>>
module.exports = function buildProjects({ projects }) {
  return pSeries(projects.map(queueBuild))
}
