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
const requestNextVersion = require('../utils/requestNextVersion')

module.exports = async function tag() {
  TerminalUtils.title('Running tag...')

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)
  const appConfig = AppUtils.getConfig()
  const targetBranch = R.path(['masterBranchName'], appConfig)
  const targetRemote = R.path(['tagging', 'remoteName'], appConfig)
  const enableRemotePush = R.path(['tagging', 'enableRemotePush'], appConfig)

  // Ensure there are no uncommitted changes
  if (GitUtils.uncommittedChanges().length > 0) {
    throw new Error('You have uncommitted changes. Please commit your changes and then try again.')
  }

  // Ensure on correct branch
  const actualBranch = GitUtils.getCurrentBranch()
  if (targetBranch !== actualBranch) {
    throw new Error(
      dedent(`
        You are not on the "master" branch (${targetBranch}).

          ${chalk.blue(`git checkout ${targetBranch}`)}
      `),
    )
  }

  const lastVersionTag = AppUtils.getLastVersionTag()
  const lastVersion = lastVersionTag ? semver.clean(lastVersionTag) : '0.0.0'
  TerminalUtils.verbose(`Previous tag version is ${lastVersion}`)

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
    // We need to make sure that the projects we are tagging have all
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
    TerminalUtils.info(
      'No changes have occurred on any of your projects since the previous tag. Exiting...',
    )
    process.exit(0)
  }

  // Let's get a sorted version of finalToRelease by filtering allProjects
  // which will already be in a safe build order.
  finalToRelease = allProjectsArray.filter(cur => !!R.find(R.equals(cur), finalToRelease))

  TerminalUtils.verbose(`Updating version for [${finalToRelease.map(R.prop('name')).join(', ')}]`)

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

  const tagAnswer = await TerminalUtils.confirm(
    `We have resolved that the following projects have changed since the previous tag.  Are you happy for us to update the version for the respective projects to match the new tag?${EOL}\t${finalToRelease
      .map(({ name }) => `${name} ${previousVersions[name]} -> ${versions[name]}`)
      .join(`${EOL}\t`)}`,
  )

  if (!tagAnswer) {
    process.exit(0)
  }

  // Build..
  ProjectUtils.linkAllProjects()
  await pSeries(allProjectsArray.map(project => () => ProjectUtils.compileProject(project)))

  // Then update the version against the original package.json
  finalToRelease.forEach(project => ProjectUtils.updateVersion(project, versions[project.name]))

  try {
    GitUtils.stageAllChanges()
    GitUtils.commit(nextVersionTag)
  } catch (err) {
    finalToRelease.forEach(project =>
      ProjectUtils.updateVersion(project, previousVersions[project.name]),
    )
    throw err
  }

  // Then tag the repo...
  try {
    GitUtils.addAnnotatedTag(nextVersionTag)
  } catch (err) {
    GitUtils.undoPreviousCommit()
    throw err
  }

  // Then push to the remote git repo (if enabled)
  if (enableRemotePush) {
    try {
      GitUtils.pushWithTags(targetRemote, [nextVersionTag])
    } catch (err) {
      console.log(err)
      try {
        GitUtils.removeTag(nextVersionTag)
        GitUtils.undoPreviousCommit()
      } catch (rollBackErr) {
        TerminalUtils.error(
          'The new tag failed to get pushed to the remote target.  Therefore we tryied to undo the tag, however an error occurred whilst we tried to do this.  We apologise and ask that you report this issue so that we can try and prevent it from occuring in the future.',
          rollBackErr,
        )
      }
      process.exit(1)
    }
  }

  TerminalUtils.info(`${nextVersionTag} tag created`)

  TerminalUtils.success('Done')
}
