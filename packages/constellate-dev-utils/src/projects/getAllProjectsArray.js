// @flow

import type { Project } from '../types'

const R = require('ramda')
const getAllProjects = require('./getAllProjects')

module.exports = function getAllProjectsArray(skipCache?: boolean): Array<Project> {
  return R.values(getAllProjects(skipCache))
}
