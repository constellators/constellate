const pSeries = require('p-series')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = async function install() {
  TerminalUtils.title('Running install...')

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = ProjectUtils.getAllProjectsArray()

  // First clean the projects down
  ProjectUtils.cleanProjects(allProjectsArray)

  // Then run install for each project
  await pSeries(
    allProjectsArray.map(project => () => {
      const linkedDependencies = project.dependencies.map(x => allProjects[x])
      const linkedDevDependencies = project.devDependencies.map(x => allProjects[x])
      const relinkDeps = () => {
        ProjectUtils.addLinkedDependencies(project, linkedDependencies, 'dependencies')
        ProjectUtils.addLinkedDependencies(project, linkedDevDependencies, 'devDependencies')
      }
      ProjectUtils.removeLinkedDependencies(
        project,
        linkedDependencies.concat(linkedDevDependencies),
      )
      try {
        TerminalUtils.info(`Installing dependencies for ${project.name}...`)
        ProjectUtils.installDeps(project)
      } catch (err) {
        relinkDeps()
        throw err
      }
      relinkDeps()
    }),
  )

  // Then link the projects
  ProjectUtils.linkAllProjects()

  TerminalUtils.success('Done')
}
