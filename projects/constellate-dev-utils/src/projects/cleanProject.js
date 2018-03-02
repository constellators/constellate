// @flow

import type { Project, CleanOptions } from '../types'

const fs = require('fs-extra')
const TerminalUtils = require('../terminal')

const defaultOptions = {
  nodeModules: false,
  build: false,
}

module.exports = async function cleanProject(
  project: Project,
  options?: CleanOptions = {},
) {
  const { nodeModules, build } = Object.assign({}, defaultOptions, options)

  if (build && project.plugins.buildPlugin != null) {
    await project.plugins.buildPlugin.clean()
    TerminalUtils.verbose(`Removed build output for ${project.name}`)
  }

  if (nodeModules && fs.existsSync(project.paths.nodeModules)) {
    fs.removeSync(project.paths.nodeModules)
    TerminalUtils.verbose(`Removed node_modules for ${project.name}`)
  }
}
