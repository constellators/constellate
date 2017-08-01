const start = require('./start')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function webpackDevelop(project, options) {
  return {
    start: watcher => start(project, options, watcher),
  }
}
