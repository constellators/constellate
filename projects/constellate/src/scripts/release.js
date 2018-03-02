// @flow

const { EOL } = require('os')
const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const dedent = require('dedent')
const chalk = require('chalk')
const readPkg = require('read-pkg')
const {
  TerminalUtils,
  GitUtils,
  AppUtils,
  ProjectUtils,
  ChildProcessUtils,
} = require('constellate-dev-utils')
const requestNextVersion = require('../utils/requestNextVersion')

type Options = {|
  persist?: boolean,
  force?: boolean,
|}

const defaultOptions: Options = {
  persist: true,
  force: false,
}

module.exports = async function release(options: Options = defaultOptions) {
  TerminalUtils.verbose(
    `Running release with options: ${JSON.stringify(
      R.pick(['persist', 'force'], options),
      null,
      2,
    )}`,
  )
  TerminalUtils.title('Running release...')

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)
  const appConfig = AppUtils.getConfig()
  const targetBranch = R.path(['publishing', 'gitBranchName'], appConfig)
  const targetRemote = R.path(['publishing', 'gitRemoteName'], appConfig)
  const enableRemotePush = R.path(
    ['publishing', 'enableGitRemotePush'],
    appConfig,
  )

  const rebuildProjects = async () => {
    const updatedAllProjectsArray = ProjectUtils.getAllProjectsArray(true)
    await pSeries(
      updatedAllProjectsArray.map(project => () =>
        ProjectUtils.buildProject(project, {
          quiet: true,
        }),
      ),
    )
  }

  // Ensure there are no uncommitted changes
  if (GitUtils.uncommittedChanges().length > 0) {
    throw new Error(
      'You have uncommitted changes. Please commit your changes and then try again.',
    )
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

  if (options.persist && enableRemotePush) {
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

  // Now determine the projects with changes that need to be released.

  const isFirstPublish = lastVersion === '0.0.0'

  const toUpdateVersionFor =
    isFirstPublish || options.force // We will release all the projects as this is our first release.
      ? // OR if the force option was provided
        allProjectsArray // Else we filter to the projects that have had changes since the last release
      : allProjectsArray.filter(ProjectUtils.changedSince(lastVersionTag))

  let finalToUpdateVersionFor

  const updatingVersionForAll = R.equals(
    toUpdateVersionFor.map(R.prop('name')),
    allProjectsArray.map(R.prop('name')),
  )

  if (!updatingVersionForAll) {
    // We need to make sure that the projects we are tagging have all
    // their dependants included in the release process, as their dependants
    // dependencies will essentially be updated, therefore they are changing too.

    const allProjectsToUpdateVersionFor = R.pipe(
      R.chain(R.prop('allLinkedDependants')),
      R.map(x => allProjects[x]),
      R.concat(toUpdateVersionFor),
    )(toUpdateVersionFor)

    finalToUpdateVersionFor = allProjectsToUpdateVersionFor.reduce(
      (acc, cur) => {
        if (R.find(R.equals(cur), acc)) {
          return acc
        }
        return [...acc, cur]
      },
      toUpdateVersionFor,
    )
  } else {
    finalToUpdateVersionFor = toUpdateVersionFor
  }

  if (finalToUpdateVersionFor.length === 0) {
    TerminalUtils.info(
      'None of your projects have any changes to be released. Exiting...',
    )
    process.exit(0)
  }

  // Ask for the next version
  const nextVersion = await requestNextVersion(lastVersion)
  const nextVersionTag = `v${nextVersion}`

  // Let's get a sorted version of finalToUpdateVersionFor by filtering allProjects
  // which will already be in a safe build order.
  finalToUpdateVersionFor = allProjectsArray.filter(
    cur => !!R.find(R.equals(cur), finalToUpdateVersionFor),
  )

  TerminalUtils.verbose(
    `Updating versions for [${finalToUpdateVersionFor
      .map(R.prop('name'))
      .join(', ')}]`,
  )

  // Get the current versions for each project
  const previousVersions = allProjectsArray.reduce(
    (acc, cur) =>
      Object.assign(acc, {
        [cur.name]: cur.version,
      }),
    {},
  )

  // Prep the next version numbers for each project
  const versions = Object.assign(
    {},
    previousVersions,
    finalToUpdateVersionFor.reduce(
      (acc, cur) =>
        Object.assign(acc, {
          [cur.name]: nextVersion,
        }),
      {},
    ),
  )

  TerminalUtils.verbose(
    `Using versions: ${EOL}${JSON.stringify(versions, null, 2)}`,
  )

  const tagAnswer = await TerminalUtils.confirm(
    `The following projects will be released with the respective new versions. Proceed?${EOL}\t${finalToUpdateVersionFor
      .map(
        ({ name }) => `${name} ${previousVersions[name]} -> ${versions[name]}`,
      )
      .join(`${EOL}\t`)}`,
  )

  if (!tagAnswer) {
    process.exit(0)
  }

  TerminalUtils.info('Building projects in preparation for release...')

  // Build..
  await pSeries(
    allProjectsArray.map(project => () =>
      ProjectUtils.buildProject(project, {
        quiet: true,
      }),
    ),
  )

  // Then update the versions for each project
  finalToUpdateVersionFor.forEach(project => {
    ProjectUtils.updateVersions(project, versions)
  })

  if (options.persist) {
    TerminalUtils.verbose('Tagging project for github release')

    try {
      GitUtils.stageAllChanges()
      GitUtils.commit(nextVersionTag)
    } catch (err) {
      // Revert the version changes.
      finalToUpdateVersionFor.forEach(project =>
        ProjectUtils.updateVersions(project, previousVersions),
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
        TerminalUtils.error('Failed to push to remote git repo', err)
        try {
          GitUtils.removeTag(nextVersionTag)
          GitUtils.undoPreviousCommit()
        } catch (rollBackErr) {
          TerminalUtils.error(
            'We failed to push the new version tag to the remote git target.  Therefore we tried to undo the tag, however an error occurred whilst we tried to do this.  You may need to ensure that your repo is back to its pre-release state. We apologise and ask that you report this issue so that we can try and prevent it from occuring in the future.',
            rollBackErr,
          )
        }
        process.exit(1)
      }
    }
  } else {
    TerminalUtils.verbose('Skipping tagging of project for github release')
  }

  TerminalUtils.info(
    'Updating versions for each project and their linked dependencies...',
  )

  // Rebuild to ensure new versions are being referenced
  await rebuildProjects()

  TerminalUtils.info(
    'Projects are versioned, publishing them to NPM repository...',
  )

  // 📦 Publish

  const failedToPublish = []

  finalToUpdateVersionFor.forEach(project => {
    const pkgJson = readPkg.sync(project.paths.packageJson)
    if (pkgJson.private) {
      TerminalUtils.warning(
        `Can't publish ${project.name} as it is marked as private`,
      )
    } else {
      TerminalUtils.info(`Publishing ${project.name}...`)

      try {
        ChildProcessUtils.execSync('npm', ['publish'], {
          cwd: project.paths.root,
        })
        TerminalUtils.verbose(`Published ${project.name}`)
      } catch (err) {
        TerminalUtils.warning(`Failed to publish ${project.name}`)
        TerminalUtils.verbose(err)
        failedToPublish.push(project)
      }
    }
  })

  if (failedToPublish.length > 0) {
    TerminalUtils.warning(
      dedent(`
      Unfortunately an error occurred and we could not publish the following projects:

      \t${failedToPublish.map(p => chalk.green(p.name)).join(`${EOL}\t`)}

      This could be due to a number of reasons, such as a network error.

      You can retry publishing them at any time by running the following commands:

      \t${failedToPublish
        .map(p => `${chalk.blue('npm publish')} ${chalk.green(p.paths.root)}`)
        .join(`${EOL}\t`)}

      NOTE: If you decide to retry the publishing of them at a later point you
      may need to make sure that your run the build command first -

      \t${chalk.blue('npx constellate build')}
    `),
    )
  }

  if (!options.persist) {
    // As this release isn't being persisted we must roll back all the file
    // changes and then rebuild the projects.
    GitUtils.clearAllChanges()
    await rebuildProjects()
  }

  TerminalUtils.success('Done')
}
