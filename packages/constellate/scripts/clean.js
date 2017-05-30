const cleanBuild = require('../projects/cleanBuild')
const cleanProjects = require('../projects/cleanProjects')

module.exports = (projects) => {
  cleanBuild()
  cleanProjects(projects)
}
