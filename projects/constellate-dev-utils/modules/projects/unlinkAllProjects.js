//      

const getAllProjectsArray = require('./getAllProjectsArray')
const unlinkProject = require('./unlinkProject')

module.exports = function unlinkAllProjects()       {
  const projects = getAllProjectsArray()
  projects.forEach(unlinkProject)
}
