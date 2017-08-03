// @flow

import type { Project, CleanOptions } from '../types'

const pSeries = require('p-series')

const cleanProject = require('./cleanProject')

module.exports = async function cleanProjects(
  projects: Array<Project>,
  options?: CleanOptions,
): Promise<void> {
  await pSeries(projects.map(p => () => cleanProject(p, options)))
}
