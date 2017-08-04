// @flow

const getAllProjectsArray = require('./getAllProjectsArray')
const unlinkProject = require('./unlinkProject')

module.exports = function unlinkAllProjects(): void {
  const projects = getAllProjectsArray()
  projects.forEach(unlinkProject)
}
