// @flow

import type { Package, DevelopPlugin } from '../../types'

const TerminalUtils = require('../../terminal')
const develop = require('./develop')

module.exports = function serverPlugin(pkg: Package): DevelopPlugin {
  if (!pkg.packageJson.main) {
    TerminalUtils.error(
      `You must provide a "main" within your package.json when using the "server" develop plugin. See the configuration for ${
        pkg.name
      }`,
    )
    process.exit(1)
  }

  return {
    name: 'constellate-core-plugin/sever',
    build: () => {
      TerminalUtils.error('"build" not supported by "server" plugin')
      process.exit(1)
    },
    clean: () => {
      TerminalUtils.error('"clean" not supported by "server" plugin')
      process.exit(1)
    },
    develop: () => develop(pkg),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "server" plugin')
      process.exit(1)
    },
  }
}
