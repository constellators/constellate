const semver = require('semver')
const GitUtils = require('constellate-dev-utils/modules/git')

module.exports = function getLastVersion(project) {
  const lastCommit = GitUtils.getLastCommitIn(project.paths.root)
  const lastTagInfo = GitUtils.getLastAnnotatedTagInfoSince(lastCommit)
  return lastTagInfo ? semver.clean(lastTagInfo.tag) : '0.0.0'
}
