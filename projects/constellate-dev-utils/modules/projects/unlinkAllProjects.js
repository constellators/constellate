const getAllProjects = require('./getAllProjects')
const unlinkProject = require('./unlinkProject')

module.exports = function unlinkAllProjects() {
  const projects = getAllProjects()
  Object.keys(projects).forEach(name => unlinkProject(projects[name]))
}
