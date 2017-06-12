const start = require('./start')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function serverDevelop(project, options, watcher) {
  return { start: () => start(project) }
}
