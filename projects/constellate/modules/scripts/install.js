const pSeries = require('p-series')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = async function install() {
  TerminalUtils.title('Running install...')

  const allProjects = ProjectUtils.getAllProjectsArray()

  // First clean the projects down
  ProjectUtils.cleanProjects(allProjects)

  // Then run install for each project
  await pSeries(
    allProjects.map(project => () => {
      TerminalUtils.info(`Installing dependencies for ${project.name}...`)
      ProjectUtils.installDeps(project)
    }),
  )

  // Then link the projects
  ProjectUtils.linkAllProjects()

  TerminalUtils.success('Done')
}
