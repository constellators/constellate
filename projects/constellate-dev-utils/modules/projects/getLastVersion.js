const semver = require('semver')
const readPkg = require('read-pkg')
const dedent = require('dedent')
const GitUtils = require('../git')
const TerminalUtils = require('../terminal')

const resolveVersionFor = (project) => {
  const pkgJson = readPkg(project.paths.packageJson, { normalize: false })
  const lastAppVersionTag = GitUtils.getLastAnnotatedTagInfo()

  if (pkgJson.version && lastAppVersionTag && semver.gt(pkgJson.version, lastAppVersionTag.tag)) {
    TerminalUtils.warning(
      dedent(
        `Project has a higher version that the highest known version.oject:
        ${project.name}: ${pkgJson.version}
        Highest known version: ${semver.clean(lastAppVersionTag.tag)}`,
      ),
    )
  }

  if (pkgJson.version) {
    return semver.clean(pkgJson.version)
  }

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
