// @flow

import type { Package } from '../types'

const TerminalUtils = require('../terminal')

module.exports = async function cleanPackage(pkg: Package) {
  const buildPlugin = pkg.plugins.buildPlugin
  if (buildPlugin != null) {
    TerminalUtils.verbose(
      `Running clean from build plugin: ${buildPlugin.name}`,
    )
    await buildPlugin.clean()
    TerminalUtils.verbose(`Ran clean on ${pkg.name}`)
  } else {
    TerminalUtils.verbose(`No clean plugin to run for ${pkg.name}`)
  }
}
