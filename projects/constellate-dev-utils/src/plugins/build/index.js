// @flow

import type { Package } from '../../types'

const PackageUtils = require('../../packages')
const TerminalUtils = require('../../terminal')

// :: (Package, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function buildPlugin(pkg: Package) {
  return {
    name: 'constellate-core-plugin/build',
    clean: () => {
      TerminalUtils.error('"clean" not supported by "build" plugin')
      process.exit(1)
    },
    build: () => {
      TerminalUtils.error('"build" not supported by "build" plugin')
      process.exit(1)
    },
    develop: () =>
      PackageUtils.buildPackage(pkg)
        // we ensure that nothing is returned as we won't be resolving a
        // develop instance with kill cmd etc
        .then(() => undefined),
    deploy: () => {
      TerminalUtils.error('"deploy" not supported by "build" plugin')
      process.exit(1)
    },
  }
}
