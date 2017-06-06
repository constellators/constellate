const { EOL } = require('os')
const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const GitUtils = require('constellate-dev-utils/modules/git')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const AppUtils = require('../../utils/app')
const ProjectUtils = require('../../utils/projects')
const requestNextVersion = require('./requestNextVersion')

module.exports = function publish(projectsToPublish, options = {}) {
  const force = !!options.force

  const allProjects = ProjectUtils.getAllProjects()

  if (!GitUtils.isInitialized()) {
    TerminalUtils.error(
      'Constellate powered publishing requires that your project is initialised as a Git repository.',
    )
    process.exit(1)
  }

  const appConfig = AppUtils.getConfig()
  const enableGitPublishing = !R.path(['publishing', 'git', 'disable'], appConfig)
  const enableNPMPublishing = !R.path(['publishing', 'npm', 'disable'], appConfig)
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

    let finalToPublish

    if (!R.equals(toPublish.map(R.prop('name')), allProjects.map(R.prop('name')))) {
      // We need to make sure that the projects we are publishing have all
      // their dependants included in the publish process.

      // :: Project -> Array<Project>
      const resolveDependants = (project) => {
        const deps = R.pipe(
          // Project -> Array<string>
          R.prop('dependants'),
          // Array<string> -> Array<Project>
          R.map(depName => R.find(R.propEq('name', depName), allProjects)),
        )(project)
        return [project, ...deps, ...R.map(resolveDependants, deps)]
      }

      const allDependants = R.chain(resolveDependants, toPublish)

      finalToPublish = allDependants.reduce((acc, cur) => {
        if (R.find(R.equals(cur), acc)) {
          return acc
        }
        return [...acc, cur]
      }, toPublish)
    } else {
      finalToPublish = toPublish
    }

    if (finalToPublish.length === 0) {
      TerminalUtils.info('There are no changes to be published.')
      process.exit(0)
    }

    // Let's get a sorted version of finalToPublish by filtering allProjects
    // which will already be in a safe build order.
    finalToPublish = allProjects.filter(cur => !!R.find(R.equals(cur), finalToPublish))

    TerminalUtils.verbose(`Publishing [${finalToPublish.map(R.prop('name')).join(', ')}]`)

    // Get the current versions for each project
    const previousVersions = allProjects.reduce(
      (acc, cur) => Object.assign(acc, { [cur.name]: ProjectUtils.getLastVersion(cur) }),
      {},
    )
    // Prep the next version numbers for each project
    const versions = Object.assign(
      {},
      previousVersions,
      finalToPublish.reduce((acc, cur) => Object.assign(acc, { [cur.name]: nextVersion }), {}),
    )

    return TerminalUtils.confirm(
      `Would you like to publish the following projects with versions:${EOL}\t${finalToPublish
        .map(({ name }) => `${name} ${previousVersions[name]} -> ${versions[name]}`)
        .join(`${EOL}\t`)}`,
    ).then((answer) => {
      if (!answer) {
        return undefined
      }

      // Build..
      return (
        pSeries(
          allProjects.map(project => () => {
            ProjectUtils.prepareProject(project, { versions })
            return ProjectUtils.buildProject(project)
          }),
        )
          // Then update the source pkg json files for each project to have the
          // correct version
          .then(() => {
            finalToPublish.forEach(project =>
              ProjectUtils.updateVersion(project, versions[project.name]),
            )
            GitUtils.stageAllChanges()
          })
          // Then tag the repo...
          .then(
            () => {
              GitUtils.commit(nextVersionTag)
              GitUtils.addAnnotatedTag(nextVersionTag)
            },
            (err) => {
              TerminalUtils.error(
                'An error occurred whilst attempting to update the version data for your projects',
                err,
              )
              TerminalUtils.info('Rolling back changes and stopping publish...')
              finalToPublish.forEach(project =>
                ProjectUtils.updateVersion(project, previousVersions[project.name]),
              )
              process.exit(1)
            },
          )
          // Then publish the git repo to the remote git repo (if enabled)
          .then(
            () => {
              if (enableGitPublishing) {
                GitUtils.pushWithTags(targetRemote, [nextVersionTag])
              }
            },
            (err) => {
              TerminalUtils.error(
                'An error occurred trying to tag the git repository with the latest version',
                err,
              )
              TerminalUtils.info('Rolling back changes and stopping publish...')
              finalToPublish.forEach(project =>
                ProjectUtils.updateVersion(project, previousVersions[project.name]),
              )
              process.exit(1)
            },
          ) // Then publish to NPM (if enabled)
          .then(() => {
            if (enableNPMPublishing) {
              finalToPublish.forEach((project) => {
                const pkgJson = readPkg.sync(project.paths.packageJson)
                if (pkgJson.private) {
                  TerminalUtils.info(
                    `Not publishing ${project.name} to NPM as it is marked as private`,
                  )
                } else {
                  TerminalUtils.info(`Publishing ${project.name} to NPM...`)
                  ChildProcessUtils.execSync('npm', ['publish'], {
                    cwd: project.paths.buildRoot,
                  })
                }
              })
            }
          })
          .catch((error) => {
            // We don't do an error catch and rollback as NPM won't allow to
            // republish a version, so let's just crack on.  A new version
            // may be required to be published in order to resolve the issue.
            TerminalUtils.warning(
              'Some of your projects may not have successfully been published to NPM',
            )
            TerminalUtils.error(null, error)
          })
      )
    })
  })
}
