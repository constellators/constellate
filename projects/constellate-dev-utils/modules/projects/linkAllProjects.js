//      

const getAllProjectsArray = require('./getAllProjectsArray')
const linkProject = require('./linkProject')

module.exports = function linkAllProjects()       {
  const projects = getAllProjectsArray()
  projects.forEach(linkProject)
}
