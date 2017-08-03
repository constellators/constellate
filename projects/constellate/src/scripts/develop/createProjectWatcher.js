const chokidar = require('chokidar')
const { TerminalUtils } = require('constellate-dev-utils')

module.exports = function createProjectWatcher(onChange, project) {
  TerminalUtils.verbose(`Creating watcher for ${project.name}.`)

  const createWatcher = () => {
    const watcher = chokidar.watch(
      // TODO: Add the paths to the build folders of each of it's dependencies.
      [project.paths.root],
      {
        ignored: project.plugins.buildPlugin ? project.plugins.buildPlugin.outputDir() : undefined,
        ignoreInitial: true,
        cwd: project.paths.root,
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
