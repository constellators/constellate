const R = require('ramda')
const TerminalUtils = require('../terminal')
const getAllProjects = require('./getAllProjects')

/**
 * Filters the projects down to the given.
 *
 * @param  {Array}  [projectFilters=[]]
 *         The names of the projects to resolve. If none is specified then
 *         all of them are resolved.
 *
 * @return {Promise<Array<Project>>} The resolved projects
 */
module.exports = function resolveProjects(projectFilters = []) {
  TerminalUtils.verbose(`Resolving projects with filter [${projectFilters.join(', ')}]`)

  return new Promise((resolve, reject) => {
    const allProjects = getAllProjects()
    if (Object.keys(allProjects).length === 0) {
      reject(new Error('Could not find any projects.'))
    } else if (projectFilters.length === 0) {
      resolve(R.values(allProjects))
    } else {
      const allProjectNames = R.values(allProjects).map(R.prop('name'))
      const invalidFilters = R.without(allProjectNames, projectFilters)
      if (invalidFilters.length > 0) {
        reject(new Error(`The following projects could not be resolved:\n[${invalidFilters}]`))
      }
      resolve(projectFilters.map(x => allProjects[x]))
    }
  }).then((resolved) => {
    TerminalUtils.verbose(`Resolved: [${resolved.map(R.prop('name')).join(', ')}]`)
    return resolved
  })
}
