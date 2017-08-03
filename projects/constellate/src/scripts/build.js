// @flow

const pSeries = require('p-series')
const { TerminalUtils, ProjectUtils } = require('constellate-dev-utils')

module.exports = async function build() {
  TerminalUtils.title('Running build...')

  // Then ensure all the projects are linked
  ProjectUtils.linkAllProjects()

  // :: Project -> void -> Promise
  const queueBuild = project => () => ProjectUtils.buildProject(project)
  await pSeries(ProjectUtils.getAllProjectsArray().map(queueBuild))

  TerminalUtils.success('Done')
}
