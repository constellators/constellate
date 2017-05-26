const path = require('path')
const chokidar = require('chokidar')
const terminal = require('constellate-utils/terminal')

module.exports = function createProjectWatcher(onChange, project) {
  terminal.verbose(`Creating watcher for ${project.name}.`)

  const createWatcher = () => {
    const watcher = chokidar.watch(
      // TODO: Add the paths to the build folders of each of it's dependencies.
      [project.paths.source, path.resolve(project.paths.root, './package.json')],
      { ignoreInitial: true, cwd: project.paths.root, ignorePermissionErrors: true }
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
