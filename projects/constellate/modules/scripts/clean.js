const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = (projects) => {
  ProjectUtils.cleanBuild()
  ProjectUtils.cleanProjects(projects)
}
