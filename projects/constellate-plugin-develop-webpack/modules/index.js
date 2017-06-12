const start = require('./start')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function webpackDevelop(project, options, watcher) {
  return {
    start: () => start(project, watcher),
  }
}
