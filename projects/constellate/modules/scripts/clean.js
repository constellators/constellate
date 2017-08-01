const ProjectUtils = require('constellate-dev-utils/modules/projects')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = async (options) => {
  TerminalUtils.title('Running clean...')

  const projectsToClean = options.projects
    ? await ProjectUtils.resolveProjects(options.projects)
    : ProjectUtils.getAllProjectsArray()

  await ProjectUtils.cleanProjects(projectsToClean, {
    nodeModules: options.nodeModules,
    packageLock: options.packageLock,
    build: options.build,
  })

  TerminalUtils.success('Done')
}
