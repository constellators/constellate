const ProjectUtils = require('../../../projects')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function buildDevelopPlugin(project) {
  return {
    start: () =>
      ProjectUtils.buildProject(project)
        // we ensure that nothing is returned as we won't be resolving a
        // develop instance with kill cmd etc
        .then(() => undefined),
  }
}
