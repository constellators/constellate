const { EOL } = require('os')
const R = require('ramda')
const Git = require('constellate-dev-utils/git')
const Terminal = require('constellate-dev-utils/terminal')

const changedSince = R.curry((versionTag, project) => {
  const files = Git.changedFilesSinceIn(versionTag, project.paths.root)
  const hasChanges = files.length > 0
  if (hasChanges) {
    Terminal.verbose(
      `Since ${versionTag} the following files have changed within ${project.name}:${EOL}${files
        .map(change => `\t${change.replace(`Projects/${project.name}`, '')}`)
        .join(`${EOL}`)}`
    )
  } else {
    Terminal.verbose(`No changes on ${project.name}`)
  }
  return hasChanges
})

module.exports = changedSince
