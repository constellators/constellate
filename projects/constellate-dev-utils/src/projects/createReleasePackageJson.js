// @flow

import type { Project, ProjectVersions } from '../types'

const R = require('ramda')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const TerminalUtils = require('../terminal')
const getAllProjects = require('./getAllProjects')
const getAllProjectsArray = require('./getAllProjectsArray')

module.exports = function createReleasePackageJson(project: Project, versions: ProjectVersions) {
  const allProjects = getAllProjects()
  const allProjectsArray = getAllProjectsArray()

  const projectsWithVersion = Object.keys(versions)

  const projectHasVersion = (p: Project) => projectsWithVersion.find(x => x === p.name) != null

  if (!versions || !R.all(projectHasVersion, allProjectsArray)) {
    TerminalUtils.error(
      'When creating a build for publishing all version numbers should be provided for each project',
    )
    process.exit(1)
  }

  const sourcePkgJson = readPkg.sync(project.paths.packageJson, { normalize: false })

  const newPkgJson = Object.assign(
    {
      version: versions[project.name],
    },
    sourcePkgJson,
    {
      version: versions[project.name],
      dependencies: Object.assign(
        {},
        // Add dependency references to our constellate dependencies
        project.dependencies.reduce(
          (acc, dependencyName) =>
            Object.assign(acc, {
              [allProjects[dependencyName].packageName]: `^${versions[dependencyName]}`,
            }),
          {},
        ),
        sourcePkgJson.dependencies || {},
      ),
      devDependencies: Object.assign(
        {},
        // Add devDependencies references to our constellate dependencies
        project.devDependencies.reduce(
          (acc, dependencyName) =>
            Object.assign(acc, {
              [allProjects[dependencyName].packageName]: `^${versions[dependencyName]}`,
            }),
          {},
        ),
        sourcePkgJson.devDependencies || {},
      ),
    },
  )

  writePkg.sync(project.paths.packageJson, newPkgJson)
}
