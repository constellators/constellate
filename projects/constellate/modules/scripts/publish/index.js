const { EOL } = require('os')
const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const readPkg = require('read-pkg')
const writePkg = require('write-pkg')
const chalk = require('chalk')
const dedent = require('dedent')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const GitUtils = require('constellate-dev-utils/modules/git')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const AppUtils = require('constellate-dev-utils/modules/app')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = async function publish() {
  ProjectUtils.linkAllProjects()

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)

  if (!GitUtils.isInitialized()) {
    TerminalUtils.error(
      'Constellate powered publishing requires that your project is initialised as a Git repository.',
    )
    process.exit(1)
  }

  const appConfig = AppUtils.getConfig()
  const targetBranch = R.path(['publishing', 'branchName'], appConfig)
  const customRegistry = R.path(['publishing', 'customRegistry'], appConfig)

  const lastVersionTag = AppUtils.getLastVersionTag()
  if (!lastVersionTag) {
    TerminalUtils.error(
      dedent(`
        You have no releases to publish. Please create a release first.

            ${chalk.blue('npm run release')}
      `),
    )
  }

  const lastVersion = lastVersionTag ? semver.clean(lastVersionTag) : '0.0.0'
  TerminalUtils.verbose(`Last version is ${lastVersion}`)

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
        You are not on the "publish" branch (${targetBranch}).

          ${chalk.blue(`npm run ${targetBranch}`)}
      `),
    )
    process.exit(1)
  }

  // Checkout release
  try {
    GitUtils.checkout(lastVersionTag)
  } catch (err) {
    TerminalUtils.error(`Could not checkout target tagged release ${lastVersionTag}`, err)
    process.exit(1)
  }

  TerminalUtils.info(`Resolved last tagged release as ${lastVersion}`)

  const projectsAtVersion = allProjectsArray
    .filter(project => semver.eq(lastVersion, ProjectUtils.getLastVersion(project)))
    .map(R.prop('name'))

  const projectsToPublish = await TerminalUtils.multiSelect(
    'Which projects would you like to publish?',
    {
      choices: allProjectsArray.map(p => ({
        checked: R.contains(p.name, projectsAtVersion),
        value: p.name,
        name: `${p.name} (${ProjectUtils.getLastVersion(p)})`,
      })),
    },
  )

  console.log('Publishing', projectsToPublish)

  /*

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

      const allProjectsToPublish = R.pipe(
        R.chain(R.prop('allDependants')),
        R.map(x => allProjects[x]),
        R.concat(toPublish),
      )(toPublish)

      finalToPublish = allProjectsToPublish.reduce((acc, cur) => {
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
      allProjectsArray.forEach(cur => ProjectUtils.createReleasePackageJson(cur, versions))

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
          .then(() => {
            finalToPublish.forEach((project) => {
              const compiler = project.compilerPlugin(project)
              if (compiler.prePublish) {
                project.compiler.prePublish(project)
              }
            })
          })
          .catch((err) => {
            TerminalUtils.error('Failed to execute prePublish', err)
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
          .then(() => {
            finalToPublish.forEach((project) => {
              const compiler = project.compilerPlugin(project)
              if (compiler.postPublish) {
                project.compiler.postPublish(project)
              }
            })
          })
          .catch((err) => {
            TerminalUtils.error('Failed to execute postPublishToNPM', err)
            // Restore the original package json content
            restoreOriginalPackageJsons()
            process.exit(1)
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
  */
}
