const getAllProjects = require('./getAllProjects')
const linkProject = require('./linkProject')

module.exports = function linkAllProjects() {
  const projects = getAllProjects()
  Object.keys(projects).forEach(name => linkProject(projects[name]))
}
