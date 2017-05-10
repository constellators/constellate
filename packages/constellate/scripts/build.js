const buildProjects = require('../utils/buildProjects')

module.exports = function build({ projects }) {
  return buildProjects({ projects })
    .then(() => console.log('Build complete'))
    .catch(err => console.error(err))
}
