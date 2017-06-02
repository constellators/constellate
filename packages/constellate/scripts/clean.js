const ProjectUtils = require('../utils/projects')

module.exports = (projects) => {
  ProjectUtils.cleanBuild()
  ProjectUtils.cleanProjects(projects)
}
