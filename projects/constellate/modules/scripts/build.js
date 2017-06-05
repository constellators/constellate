const { EOL } = require('os')
const pSeries = require('p-series')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('../utils/projects')

module.exports = function build(toBuild) {
  const allProjects = ProjectUtils.getAllProjects()

  // First clear down any existing build
  ProjectUtils.cleanBuild()

  // Need to get the current version numbers for each project
  const versions = allProjects.reduce(
    (acc, cur) => Object.assign(acc, { [cur.name]: ProjectUtils.getLastVersion(cur) }),
    {},
  )

  TerminalUtils.verbose(
    `Building projects with versions:${EOL}${JSON.stringify(versions, null, 2)}`,
  )

  // :: Project -> void -> Promise
  const queueBuild = project => () => ProjectUtils.buildProject(project, { versions })

  return pSeries(toBuild.map(queueBuild))
}
