const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = function unlinkProjects(projects) {
  projects.forEach(ProjectUtils.unlinkProject)
}
