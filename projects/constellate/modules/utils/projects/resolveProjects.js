const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const getAllProjects = require('./getAllProjects')

/**
 * Filters the projects down to the given.
 *
 * @param  {Array}  [projectFilters=[]]
 *         The names of the projects to resolve. If none is specified then
 *         all of them are resolved.
 *
 * @return {Promise} The resolved projects
 */
module.exports = function resolveProjects(projectFilters = []) {
  TerminalUtils.verbose(`Resolving projects with filter [${projectFilters.join(', ')}]`)

  return new Promise((resolve, reject) => {
    const allProjects = getAllProjects()
    if (allProjects.length === 0) {
      reject(new Error('Could not find any projects.'))
    } else if (projectFilters.length === 0) {
      resolve(allProjects)
    } else {
      const allProjectNames = allProjects.map(R.prop('name'))
      const invalidFilters = R.without(allProjectNames, projectFilters)
      if (invalidFilters.length > 0) {
        reject(new Error(`The following projects could not be resolved:\n[${invalidFilters}]`))
      }
      const findProject = name => R.find(p => p.name === name, allProjects)
      resolve(projectFilters.map(findProject))
    }
  }).then((resolved) => {
    TerminalUtils.verbose(`Resolved: [${resolved.map(R.prop('name')).join(', ')}]`)
    return resolved
  })
}
