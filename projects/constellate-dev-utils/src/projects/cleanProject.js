// @flow

import type { Project } from '../types'

const TerminalUtils = require('../terminal')

module.exports = async function cleanProject(project: Project) {
  if (project.plugins.cleanPlugin != null) {
    await project.plugins.cleanPlugin.clean()
    TerminalUtils.verbose(`Ran clean on ${project.name}`)
  } else {
    TerminalUtils.verbose(`No clean plugin to run for ${project.name}`)
  }
}
