// @flow

import type { Project } from '../types'

const R = require('ramda')
const TerminalUtils = require('../terminal')
const getAllProjects = require('./getAllProjects')
const getAllProjectsArray = require('./getAllProjectsArray')

/**
 * Filters the projects down to the given.
 *
 * @param  {Array}  [projectFilters=[]]
 *         The names of the projects to resolve. If none is specified then
 *         all of them are resolved.
 *
 * @return {Promise<Array<Project>>} The resolved projects
 */
module.exports = function resolveProjects(
  projectFilters: Array<string> = [],
): Promise<Array<Project>> {
  TerminalUtils.verbose(`Resolving projects with filter [${projectFilters.join(', ')}]`)

  return new Promise((resolve, reject) => {
    const allProjectsMap = getAllProjects()
    const allProjectsArray = getAllProjectsArray()
    if (allProjectsArray.length === 0) {
      reject(new Error('Could not find any projects.'))
    } else if (projectFilters.length === 0) {
      resolve(allProjectsArray)
    } else {
      const allProjectNames = allProjectsArray.map(x => x.name)
      const invalidFilters = R.without(allProjectNames, projectFilters)
      if (invalidFilters.length > 0) {
        reject(
          new Error(`The following projects could not be resolved:\n[${invalidFilters.join(',')}]`),
        )
      }
      resolve(projectFilters.map(x => allProjectsMap[x]))
    }
  }).then((resolved) => {
    TerminalUtils.verbose(`Resolved: [${resolved.map(R.prop('name')).join(', ')}]`)
    return resolved
  })
}
