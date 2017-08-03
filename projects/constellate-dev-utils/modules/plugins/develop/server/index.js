const TerminalUtils = require('../../../terminal')

const start = require('./start')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function serverDevelop(project, options) {
  if (!project.packageJson.main) {
    TerminalUtils.error(
      `You must provide a "main" within your package.json when using the "server" develop plugin. See the configuration for ${project.name}`,
    )
    process.exit(1)
  }

  return { start: watcher => start(project, options, watcher) }
}
