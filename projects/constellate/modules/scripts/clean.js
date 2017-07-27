const ProjectUtils = require('constellate-dev-utils/modules/projects')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

const defaultOptions = {
  hardClean: false,
  projects: undefined,
}

module.exports = async (options = defaultOptions) => {
  TerminalUtils.title('Running clean...')

  const { hardClean, projects } = Object.assign({}, defaultOptions, options)

  const projectsToClean = projects
    ? await ProjectUtils.resolveProjects(projects)
    : ProjectUtils.getAllProjectsArray()

  ProjectUtils.cleanProjects(projectsToClean, { removePackageLock: hardClean })

  TerminalUtils.success('Done')
}
