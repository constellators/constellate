const GitUtils = require('constellate-dev-utils/modules/git')

module.exports = function hasUncommittedChanges(project) {
  const uncommitedFiles = GitUtils.uncommittedChangesIn(project.paths.root)
  return uncommitedFiles.length > 0
}
