const pSeries = require('p-series')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

const defaultOptions = {
  clean: false,
  hardClean: false,
  projects: undefined,
}

module.exports = async function install(options = defaultOptions) {
  TerminalUtils.title('Running install...')

  const { clean, hardClean, projects } = Object.assign({}, defaultOptions, options)

  const allProjects = ProjectUtils.getAllProjects()

  const projectsToInstall = projects
    ? await ProjectUtils.resolveProjects(projects)
    : ProjectUtils.getAllProjectsArray()

  // First clean the projects down
  if (clean || hardClean) {
    ProjectUtils.cleanProjects(projectsToInstall, { removePackageLock: hardClean })
  }

  // Then run install for each project
  await pSeries(
    projectsToInstall.map(project => () => {
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
