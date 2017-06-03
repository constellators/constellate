const R = require('ramda')
const pSeries = require('p-series')
const ChildProcessUtils = require('constellate-dev-utils/childProcess')
const AppUtils = require('../utils/app')

module.exports = function bootstrap(projects) {
  const constellateAppConfig = AppUtils.getConfig()

  const client = constellateAppConfig.packageClient === 'yarn' ? 'yarn' : 'npm'

  // Then run install for each project
  return pSeries(
    projects.map(project => () =>
      ChildProcessUtils.exec(client, ['install'], { cwd: project.paths.root })),
  )
}
