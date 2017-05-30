const path = require('path')
const fs = require('fs-extra')
const pSeries = require('p-series')
const buildProject = require('./buildProject')

// :: void => Promise
module.exports = function buildProjects(projects) {
  // First clear down any existing build
  const buildRoot = path.resolve(process.cwd(), './build')
  if (fs.existsSync(buildRoot)) {
    fs.removeSync(buildRoot)
  }

  // :: Project -> void -> Promise
  const queueBuild = project => () => buildProject(projects, project)

  return pSeries(projects.map(queueBuild))
}
