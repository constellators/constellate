const { EOL } = require('os')
const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const GitUtils = require('constellate-dev-utils/modules/git')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const AppUtils = require('constellate-dev-utils/modules/app')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const requestNextVersion = require('./requestNextVersion')

module.exports = function publish(projectsToPublish, options = {}) {
  const force = !!options.force

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)

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
  const projectsWithUncommitedChanges = allProjectsArray.filter(ProjectUtils.hasUncommittedChanges)
  if (projectsWithUncommitedChanges.length > 0) {
    TerminalUtils.error(
      `The following projects have uncommitted changes within them. Please commit your changes and then try again.${EOL}${projectsWithUncommitedChanges
        .map(R.prop('name'))
        .join(', ')}`,
    )
    process.exit(1)
  }

  // Ensure on correct branch
  const targetBranch = R.path(['releaseBranch'], appConfig) || 'master'
  const targetRemote = R.path(['publishing', 'git', 'remote'], appConfig) || 'origin'
  const actualBranch = GitUtils.getCurrentBranch()
  if (targetBranch !== actualBranch) {
    try {
      GitUtils.checkout(targetBranch)
    } catch (err) {
      TerminalUtils.error(`Could not switch to the "release" branch (${targetBranch})`, err)
      process.exit(1)
    }
  }

  if (enableGitPublishing) {
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
  return requestNextVersion(lastVersion).then((nextVersion) => {
    const isFirstPublish = lastVersion === '0.0.0'
    const nextVersionTag = `v${nextVersion}`

    const toPublish = isFirstPublish
      ? // We will publish all the ProjectUtils as this is our first publish.
        allProjectsArray
      : force
        ? projectsToPublish
        : projectsToPublish.filter(ProjectUtils.changedSince(lastVersionTag))

    let finalToPublish

    if (!R.equals(toPublish.map(R.prop('name')), allProjectsArray.map(R.prop('name')))) {
      // We need to make sure that the projects we are publishing have all
      // their dependants included in the publish process.

      // :: Project -> Array<Project>
      const resolveDependants = (project) => {
        const deps = R.pipe(
          // Project -> Array<string>
          R.prop('dependants'),
          // Array<string> -> Array<Project>
          R.map(depName => allProjects[depName]),
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
    finalToPublish = allProjectsArray.filter(cur => !!R.find(R.equals(cur), finalToPublish))

    TerminalUtils.verbose(`Publishing [${finalToPublish.map(R.prop('name')).join(', ')}]`)

    // Get the current versions for each project
    const previousVersions = allProjectsArray.reduce(
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

      // Get the original package.json file contents for each project.
      const originalPackageJsons = allProjectsArray.reduce(
        (acc, cur) =>
          Object.assign(acc, {
            [cur.name]: readPkg.sync(cur.paths.packageJson, { normalize: false }),
          }),
        {},
      )

      // Upate the package.jsons for each project to be the "publish" ready
      // versions.
      allProjectsArray.forEach(cur => ProjectUtils.createPublishPackageJson(cur, versions))

      const restoreOriginalPackageJsons = () =>
        allProjectsArray.forEach(cur =>
          writePkg.sync(cur.paths.packageJson, originalPackageJsons[cur.name]),
        )

      // Build..
      return (
        pSeries(allProjectsArray.map(project => () => ProjectUtils.compileProject(project)))
          .catch((err) => {
            TerminalUtils.error('Failed to build projects in prep for publish', err)
            restoreOriginalPackageJsons()
            process.exit(1)
          })
          // Then publish to NPM (if enabled)
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
            // We don't rollback NPM publishing as NPM won't allow us to
            // republish a previously published version (even if it got
            // unpublished).
            TerminalUtils.warning(
              'Some of your projects may not have successfully been published to NPM',
            )
            TerminalUtils.error(null, error)
          })
          // Then update the source pkg json files for each project to have the
          // correct version
          .then(() => {
            // Restore the original package json content
            restoreOriginalPackageJsons()
            // Then just increment the version against the original package.json
            finalToPublish.forEach(project =>
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
            finalToPublish.forEach(project =>
              ProjectUtils.updateVersion(project, previousVersions[project.name]),
            )
            process.exit(1)
          })
          // Then publish the git repo to the remote git repo (if enabled)
          .then(() => {
            if (enableGitPublishing) {
              GitUtils.pushWithTags(targetRemote, [nextVersionTag])
            }
          })
          .catch((err) => {
            TerminalUtils.error(
              'An error occurred trying to tag the git repository with the latest version',
              err,
            )
            TerminalUtils.info('Rolling back changes and stopping publish...')
            finalToPublish.forEach(project =>
              ProjectUtils.updateVersion(project, previousVersions[project.name]),
            )
            process.exit(1)
          })
      )
    })
  })
}
