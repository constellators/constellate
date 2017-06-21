const ProjectUtils = require('../../../projects')

// :: (Project, DevelopOptions, Watcher) -> DevelopAPI
module.exports = function compileDevelop(project) {
  return {
    start: () =>
      ProjectUtils.compileProject(project)
        // we ensure that nothing is returned as we won't be resolving a
        // develop instance with kill cmd etc
        .then(() => undefined),
  }
}
