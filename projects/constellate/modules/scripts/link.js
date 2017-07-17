const ProjectUtils = require('constellate-dev-utils/modules/projects')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function linkProjects() {
  TerminalUtils.title('Running link...')
  ProjectUtils.linkAllProjects()
  TerminalUtils.success('Done')
}
