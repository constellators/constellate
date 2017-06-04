const { EOL } = require('os')
const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const TerminalUtils = require('constellate-dev-utils/terminal')
const GitUtils = require('constellate-dev-utils/git')
const AppUtils = require('../../utils/app')
const ProjectUtils = require('../../utils/projects')
const requestNextVersion = require('./requestNextVersion')

module.exports = function publish(projectsToPublish, options = {}) {
  const force = !!options.force

  const allProjects = ProjectUtils.getAllProjects()

  if (!GitUtils.isInitialized()) {
    TerminalUtils.error(
      'Constellate publishing requires that your project is initialised as a Git repository.',
    )
    process.exit(1)
  }

  const appConfig = AppUtils.getConfig()
  const lastVersionTag = AppUtils.getLastVersionTag()
  const lastVersion = lastVersionTag ? semver.clean(lastVersionTag) : '0.0.0'
  TerminalUtils.verbose(`Last version is ${lastVersion}`)

  // Ensure there are no uncommitted changes
  const projectsWithUncommitedChanges = allProjects.filter(ProjectUtils.hasUncommittedChanges)
  if (projectsWithUncommitedChanges.length > 0) {
    TerminalUtils.error(
      `The following projects have uncommitted changes within them. Please commit your changes and then try again.${EOL}${projectsWithUncommitedChanges
        .map(R.prop('name'))
        .join(', ')}`,
    )
    process.exit(1)
  }

  // Ensure on correct branch
  const enableGitPublishing = !R.path(['publishing', 'git', 'disable'], appConfig)
  const targetBranch = R.path(['publishing', 'git', 'branch'], appConfig) || 'master'
  const targetRemote = R.path(['publishing', 'git', 'remote'], appConfig) || 'origin'
  const actualBranch = GitUtils.getCurrentBranch()
  if (targetBranch !== actualBranch) {
    try {
      GitUtils.checkout(targetBranch)
    } catch (err) {
      TerminalUtils.error(`Could not switch to the publish branch (${targetBranch})`)
    }
  }

  // Does the target remote exist?
  const remoteExists = GitUtils.doesRemoteExist(targetRemote)

  if (enableGitPublishing && !remoteExists) {
    TerminalUtils.error(`Target git remote '${targetRemote}' does not exist.`)
    process.exit(1)
  }

  if (enableGitPublishing && !GitUtils.isUpToDateWithRemote(targetRemote)) {
    TerminalUtils.error(
      `There are changes on remote '${targetRemote}' that need to be merged into your local repository.`,
    )
    process.exit(1)
  }

  // Ask for the next version
  return requestNextVersion(lastVersion).then((nextVersion) => {
    const isFirstPublish = lastVersion === '0.0.0'
    const nextVersionTag = `v${nextVersion}`

    const toPublish = isFirstPublish
      ? // We will publish all the ProjectUtils as this is our first publish.
        allProjects
      : force
          ? projectsToPublish
          : projectsToPublish.filter(ProjectUtils.changedSince(lastVersionTag))
    if (toPublish.length === 0) {
      TerminalUtils.info('There are no changes to be published.')
      return undefined
    }

    // Prep the correct version number for each project
    const versions = Object.assign(
      {},
      allProjects.reduce(
        (acc, cur) => Object.assign(acc, { [cur.name]: ProjectUtils.getLastVersion(cur) }),
        {},
      ),
      toPublish.reduce((acc, cur) => Object.assign(acc, { [cur.name]: nextVersion }), {}),
    )

    // Build..
    return (
      pSeries(toPublish.map(project => () => ProjectUtils.buildProject(project, { versions })))
        // Then publish to NPM...
        .then(() => pSeries(toPublish.map(project => () => ProjectUtils.publishToNPM(project))))
        // Then tag the git repo...
        .then(() => GitUtils.addAnnotatedTag(nextVersionTag))
        // Then push the git repo with the tag if there is a remote
        .then(() => {
          if (enableGitPublishing) {
            GitUtils.pushWithTags(targetRemote, [nextVersionTag])
          }
        })
    )
  })
}
