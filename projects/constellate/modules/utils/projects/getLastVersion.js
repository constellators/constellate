const semver = require('semver')
const readPkg = require('read-pkg')
const GitUtils = require('constellate-dev-utils/modules/git')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

const resolveVersionFor = (project) => {
  const pkgJson = readPkg(project.paths.packageJson, { normalize: false })
  if (pkgJson.version) {
    return semver.clean(pkgJson.version)
  }

  const lastAppVersionTag = GitUtils.getLastAnnotatedTagInfo()
  if (lastAppVersionTag) {
    return semver.clean(lastAppVersionTag.tag)
  }

  return '0.0.0'
}

module.exports = function getLastVersion(project) {
  const result = resolveVersionFor(project)
  TerminalUtils.verbose(`Resolved last version for project to be ${result}`)
  return result
}
