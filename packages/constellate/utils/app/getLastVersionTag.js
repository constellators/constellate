const git = require('constellate-dev-utils/git')
const TerminalUtils = require('constellate-dev-utils/terminal')

module.exports = function getLastVersionTag() {
  const lastTagInfo = git.getLastAnnotatedTagInfo()
  if (lastTagInfo) {
    const { tag } = lastTagInfo
    TerminalUtils.verbose(`Resolved ${tag} as the last version for the application`)
    return tag
  }
  TerminalUtils.verbose('No published version exists for the application')
  return undefined
}
