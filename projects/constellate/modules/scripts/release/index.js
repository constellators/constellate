const { EOL } = require('os')
const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const dedent = require('dedent')
const chalk = require('chalk')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const GitUtils = require('constellate-dev-utils/modules/git')
const AppUtils = require('constellate-dev-utils/modules/app')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const requestNextVersion = require('./requestNextVersion')

module.exports = async function release() {
  ProjectUtils.linkAllProjects()

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)

  if (!GitUtils.isInitialized()) {
    TerminalUtils.error(
      'Constellate powered releasing requires that your project is a Git repository.',
    )
    process.exit(1)
  }

  const appConfig = AppUtils.getConfig()
  const targetBranch = R.path(['releasing', 'branchName'], appConfig)
  const targetRemote = R.path(['releasing', 'remoteName'], appConfig)
  const enableRemotePush = R.path(['releasing', 'enableRemotePush'], appConfig)

  // Ensure there are no uncommitted changes
  if (GitUtils.uncommittedChanges().length > 0) {
    TerminalUtils.error(
      'You have uncommitted changes. Please commit your changes and then try again.',
    )
    process.exit(1)
  }

  // Ensure on correct branch
  const actualBranch = GitUtils.getCurrentBranch()
  if (targetBranch !== actualBranch) {
    TerminalUtils.error(
      dedent(`
        You are not on the "release" branch (${targetBranch}).

          ${chalk.blue(`npm run ${targetBranch}`)}
      `),
    )
    process.exit(1)
  }

  const lastVersionTag = AppUtils.getLastVersionTag()
  const lastVersion = lastVersionTag ? semver.clean(lastVersionTag) : '0.0.0'
  TerminalUtils.verbose(`Last version is ${lastVersion}`)

  if (enableRemotePush) {
    // Does the target remote exist?
    const remoteExists = GitUtils.doesRemoteExist(targetRemote)
    if (!remoteExists) {
      TerminalUtils.error(`Target git remote '${targetRemote}' does not exist.`)
      process.exit(1)
    }
    if (!GitUtils.isUpToDateWithRemote(targetRemote)) {
      TerminalUtils.error(
        `There are changes on remote '${targetRemote}' that need to be merged into your local repository.`,
      )
      process.exit(1)
    }
  }

  // Ask for the next version
  const nextVersion = await requestNextVersion(lastVersion)

  const isFirstPublish = lastVersion === '0.0.0'
  const nextVersionTag = `v${nextVersion}`

  const toRelease = isFirstPublish
    ? // We will publish all the ProjectUtils as this is our first publish.
      allProjectsArray
    : // Or all projects that have had changes since the last release
      allProjectsArray.filter(ProjectUtils.changedSince(lastVersionTag))

  let finalToRelease

  if (!R.equals(toRelease.map(R.prop('name')), allProjectsArray.map(R.prop('name')))) {
    // We need to make sure that the projects we are releasing have all
    // their dependants included in the release process, as their dependants
    // dependencies will essentially be updated, therefore they are changing too.

    const allProjectsToRelease = R.pipe(
      R.chain(R.prop('allDependants')),
      R.map(x => allProjects[x]),
      R.concat(toRelease),
    )(toRelease)

    finalToRelease = allProjectsToRelease.reduce((acc, cur) => {
      if (R.find(R.equals(cur), acc)) {
        return acc
      }
      return [...acc, cur]
    }, toRelease)
  } else {
    finalToRelease = toRelease
  }

  if (finalToRelease.length === 0) {
    TerminalUtils.info('There are no changes to be released.')
    process.exit(0)
  }

  // Let's get a sorted version of finalToRelease by filtering allProjects
  // which will already be in a safe build order.
  finalToRelease = allProjectsArray.filter(cur => !!R.find(R.equals(cur), finalToRelease))

  TerminalUtils.verbose(`Releasing [${finalToRelease.map(R.prop('name')).join(', ')}]`)

  // Get the current versions for each project
  const previousVersions = allProjectsArray.reduce(
    (acc, cur) => Object.assign(acc, { [cur.name]: ProjectUtils.getLastVersion(cur) }),
    {},
  )
  // Prep the next version numbers for each project
  const versions = Object.assign(
    {},
    previousVersions,
    finalToRelease.reduce((acc, cur) => Object.assign(acc, { [cur.name]: nextVersion }), {}),
  )

  const releaseAnswer = await TerminalUtils.confirm(
    `Would you like to do the following release?${EOL}\t${finalToRelease
      .map(({ name }) => `${name} ${previousVersions[name]} -> ${versions[name]}`)
      .join(`${EOL}\t`)}`,
  )

  if (!releaseAnswer) {
    process.exit(0)
  }

  // Build..
  return (
    pSeries(allProjectsArray.map(project => () => ProjectUtils.compileProject(project)))
      .catch((err) => {
        TerminalUtils.error('Failed to build projects in prep for release', err)
        process.exit(1)
      })
      // Then update the source pkg json files for each project to have the
      // correct version
      .then(() => {
        // Then just increment the version against the original package.json
        finalToRelease.forEach(project =>
          ProjectUtils.updateVersion(project, versions[project.name]),
        )
        GitUtils.stageAllChanges()
      })
      // Then tag the repo...
      .then(() => {
        GitUtils.commit(nextVersionTag)
        GitUtils.addAnnotatedTag(nextVersionTag)
      })
      .catch((err) => {
        TerminalUtils.error(
          'An error occurred whilst attempting to update the version data for your projects',
          err,
        )
        TerminalUtils.info('Rolling back changes and stopping publish...')
        finalToRelease.forEach(project =>
          ProjectUtils.updateVersion(project, previousVersions[project.name]),
        )
        process.exit(1)
      })
      // Then push to the remote git repo (if enabled)
      .then(() => {
        if (enableRemotePush) {
          GitUtils.pushWithTags(targetRemote, [nextVersionTag])
        }
      })
      .catch((err) => {
        TerminalUtils.error(
          'An error occurred trying to push the release to the remote repository',
          err,
        )
        return TerminalUtils.confirm('Would you like to undo the release?')
          .then((undoAnswer) => {
            if (!undoAnswer) {
              process.exit(1)
            }
            TerminalUtils.info('Rolling back changes...')

            // TODO: A cleverer rollback
            // get last version, compare to prev version, if not same then
            // update and commit changes.
            // GitUtils.stageAllChanges()

            finalToRelease.forEach(project =>
              ProjectUtils.updateVersion(project, previousVersions[project.name]),
            )
            // TODO: git checkout .
            // TODO: git reset HEAD
            // TODO: git checkout .
            GitUtils.removeTag(nextVersionTag)
            TerminalUtils.info('Done.')
          })
          .catch((rollBackErr) => {
            TerminalUtils.error('Ah! The rollback failed. Sorry.', rollBackErr)
            process.exit(1)
          })
      })
      .then(() => {
        TerminalUtils.success(`Version ${nextVersionTag} released`)
      })
  )
}
