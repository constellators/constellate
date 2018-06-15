// @flow

import type { Package, PackageWatcher } from 'constellate-dev-utils/build/types'

const { TerminalUtils } = require('constellate-dev-utils')

const noPluginResult = {
  kill: () => Promise.resolve(),
}

module.exports = function createPackageConductor(
  pkg: Package,
  watcher: PackageWatcher,
) {
  let runningDevelopInstance

  return {
    // :: void -> Promise
    start: () => {
      TerminalUtils.verbose(`Starting develop implementation for ${pkg.name}`)

      if (pkg.plugins.developPlugin) {
        TerminalUtils.verbose(
          `No develop plugin for package, skipping package conductor creation: ${
            pkg.name
          }`,
        )
        return Promise.resolve(noPluginResult)
      }

      return pkg.plugins.developPlugin
        .develop(watcher)
        .then(developInstance => {
          runningDevelopInstance = developInstance
        })
    },

    // :: void -> Promise
    stop: () =>
      runningDevelopInstance
        ? runningDevelopInstance.kill()
        : Promise.resolve(),
  }
}
