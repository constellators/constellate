const ProjectUtils = require('constellate-dev-utils/modules/projects')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = () => {
  TerminalUtils.title('Running clean...')
  const allProjects = ProjectUtils.getAllProjectsArray()
  ProjectUtils.cleanBuild()
  ProjectUtils.cleanProjects(allProjects)
  TerminalUtils.success('Done')
}
