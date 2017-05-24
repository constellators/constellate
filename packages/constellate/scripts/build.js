const cleanProjects = require('../projects/cleanProjects')
const buildProjects = require('../projects/buildProjects')

module.exports = function build(projects) {
  cleanProjects(projects)
  return buildProjects(projects)
}
