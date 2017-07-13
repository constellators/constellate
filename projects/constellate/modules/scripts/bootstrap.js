const pSeries = require('p-series')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = function bootstrap(projects) {
  // First clean the projects down
  ProjectUtils.cleanProjects(projects)

  // Then run install for each project
  return (
    pSeries(
      projects.map(project => () => {
        TerminalUtils.info(`Installing dependencies for ${project.name}...`)
        ProjectUtils.installDeps(project)
      }),
    )
      // Then link the projects
      .then(() => ProjectUtils.linkAllProjects())
  )
}
