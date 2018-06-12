const chokidar = require('chokidar')
const { TerminalUtils } = require('constellate-dev-utils')

module.exports = function createPackageWatcher(onChange, pkg) {
  TerminalUtils.verbose(`Creating watcher for ${pkg.name}.`)

  const createWatcher = () => {
    const watcher = chokidar.watch(
      // TODO: Add the paths to the build folders of each of it's dependencies.
      [pkg.paths.root],
      {
        ignored: pkg.plugins.buildPlugin
          ? pkg.plugins.buildPlugin.outputDir()
          : undefined,
        ignoreInitial: true,
        cwd: pkg.paths.root,
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
