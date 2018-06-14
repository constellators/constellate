// @flow

import type { Package } from 'constellate-dev-utils/build/types'

const chokidar = require('chokidar')
const { TerminalUtils } = require('constellate-dev-utils')

module.exports = function createPackageWatcher(
  onChange: Function,
  pkg: Package,
) {
  TerminalUtils.verbose(`Creating watcher for ${pkg.name}.`)

  const createWatcher = () => {
    const watcher = chokidar.watch(
      // TODO: Add the paths to the build folders of each of it's dependencies.
      [pkg.paths.packageRoot],
      {
        ignored: pkg.paths.packageBuildOutput
          ? pkg.paths.packageBuildOutput
          : undefined,
        ignoreInitial: true,
        cwd: pkg.paths.packageRoot,
        ignorePermissionErrors: true,
      },
    )
    watcher
      .on('add', onChange)
      .on('change', onChange)
      .on('unlink', onChange)
      .on('addDir', onChange)
      .on('unlinkDir', onChange)
    return watcher
  }

  let watcher = null

  return {
    start: () => {
      if (!watcher) {
        watcher = createWatcher()
      }
    },
    stop: () => {
      if (watcher) {
        watcher.close()
        watcher = null
      }
    },
  }
}
