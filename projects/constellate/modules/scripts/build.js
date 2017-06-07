const pSeries = require('p-series')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = function build(toBuild) {
  // First clear down any existing build
  ProjectUtils.cleanBuild()

  // :: Project -> void -> Promise
  const queueBuild = project => () => ProjectUtils.compileProject(project)

  return pSeries(toBuild.map(queueBuild))
}
