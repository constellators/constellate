const pSeries = require('p-series')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = async function build() {
  TerminalUtils.title('Running build...')

  // First clear down any existing build
  ProjectUtils.cleanBuild()

  // Then ensure all the projects are linked
  ProjectUtils.linkAllProjects()

  // :: Project -> void -> Promise
  const queueBuild = project => () => ProjectUtils.compileProject(project)
  await pSeries(ProjectUtils.getAllProjectsArray().map(queueBuild))

  TerminalUtils.success('Done')
}
