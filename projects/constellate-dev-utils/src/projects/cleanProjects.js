// @flow

import type { Project } from '../types'

const pSeries = require('p-series')

const cleanProject = require('./cleanProject')

module.exports = async function cleanProjects(
  projects: Array<Project>,
): Promise<void> {
  await pSeries(projects.map(p => () => cleanProject(p)))
}
