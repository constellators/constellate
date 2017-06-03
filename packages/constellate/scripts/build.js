const pSeries = require('p-series')
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

  // :: Project -> void -> Promise
  const queueBuild = project => () => ProjectUtils.buildProject(project, { versions })

  return pSeries(toBuild.map(queueBuild))
}
