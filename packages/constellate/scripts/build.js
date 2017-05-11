const buildProjects = require('../projects/buildProjects')

module.exports = function build({ projects }) {
  return buildProjects({ projects })
}
