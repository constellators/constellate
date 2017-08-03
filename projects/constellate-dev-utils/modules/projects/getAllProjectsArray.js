//      

                                       

const R = require('ramda')
const getAllProjects = require('./getAllProjects')

module.exports = function getAllProjectsArray(skipCache          )                 {
  return R.values(getAllProjects(skipCache))
}
