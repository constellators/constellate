// @flow

import type { Package } from '../types'

const TerminalUtils = require('../terminal')

type Options = {
  quiet?: boolean,
}

const defaultOptions = { quiet: false }

const executeBuild = pkg => {
  if (pkg.plugins.buildPlugin) {
    TerminalUtils.verbose(
      `Building ${pkg.name} using build plugin: ${
        pkg.plugins.buildPlugin.name
      }`,
    )
  }
  return pkg.plugins.buildPlugin
    ? pkg.plugins.buildPlugin.build()
    : Promise.resolve()
}

module.exports = async function buildPackage(
  pkg: Package,
  options: ?Options = {},
): Promise<void> {
  const { quiet } = Object.assign({}, defaultOptions, options)
  TerminalUtils[quiet ? 'verbose' : 'info'](`Building ${pkg.name}...`)

  try {
    await executeBuild(pkg)
    TerminalUtils.verbose(`Built ${pkg.name}`)
  } catch (err) {
    TerminalUtils.error(`Build failed for ${pkg.name}`)
    throw err
  }
}
