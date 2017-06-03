const R = require('ramda')
const pSeries = require('p-series')
const ChildProcessUtils = require('constellate-dev-utils/childProcess')
const AppUtils = require('../utils/app')

module.exports = function update(projects) {
  const constellateAppConfig = AppUtils.getConfig()

  const client = constellateAppConfig.packageClient === 'yarn' ? 'yarn' : 'npm'

  // Then run update for each the projects
  return pSeries(
    projects.map(project => () =>
      client === 'npm'
        ? ChildProcessUtils.spawn('npm-check', ['-u'], { cwd: project.paths.root })
        : ChildProcessUtils.spawn('yarn', ['upgrade-interactive'], { cwd: project.paths.root })),
  )
}
