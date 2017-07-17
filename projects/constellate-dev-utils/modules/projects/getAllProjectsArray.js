const R = require('ramda')
const getAllProjects = require('./getAllProjects')

module.exports = function getAllProjectsArray() {
  return R.values(getAllProjects())
}
