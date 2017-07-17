const ProjectUtils = require('constellate-dev-utils/modules/projects')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function unlinkProjects() {
  TerminalUtils.title('Running unlink...')
  ProjectUtils.unlinkAllProjects()
  TerminalUtils.success('Done')
}
