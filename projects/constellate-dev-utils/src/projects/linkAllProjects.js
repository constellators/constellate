// @flow

const getAllProjectsArray = require('./getAllProjectsArray')
const linkProject = require('./linkProject')

module.exports = function linkAllProjects(): void {
  const projects = getAllProjectsArray()
  projects.forEach(linkProject)
}
