const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = function linkProjects(projects) {
  projects.forEach(ProjectUtils.linkProject)
}
