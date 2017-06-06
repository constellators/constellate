const pSeries = require('p-series')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const AppUtils = require('../utils/app')
const ProjectUtils = require('../utils/projects')

module.exports = function bootstrap(projects) {
  // First clean the projects down
  ProjectUtils.cleanProjects(projects)

  // Then run install for each project
  return pSeries(
    projects.map(project => () => {
      TerminalUtils.info(`Installing dependencies for ${project.name}...`)
      ChildProcessUtils.execSync('npm', ['install'], { cwd: project.paths.root })
    }),
  )
}
