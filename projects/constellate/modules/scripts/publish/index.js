const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const readPkg = require('read-pkg')
const chalk = require('chalk')
const dedent = require('dedent')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const GitUtils = require('constellate-dev-utils/modules/git')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const AppUtils = require('constellate-dev-utils/modules/app')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

module.exports = async function publish() {
  const appConfig = AppUtils.getConfig()
  const targetBranch = R.path(['publishing', 'branchName'], appConfig)
  const customRegistry = R.path(['publishing', 'customRegistry'], appConfig)
  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)

  const rollbackChanges = () => {
    GitUtils.checkout('.')
    GitUtils.checkout(targetBranch)
    GitUtils.checkout('.')
    allProjectsArray.forEach(ProjectUtils.installDeps)
  }

  // Just in case the user/process bails we should roll the repo back.
  ;['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
      TerminalUtils.info('Rolling back repo...')
      rollbackChanges()
      process.exit(0)
    })
  })

  // Catch any unhandled promise rejections and do a rollback.
  process.on('unhandledRejection', (err) => {
    TerminalUtils.error('Unhandled error. Rolling back repo...', err)
    rollbackChanges()
    process.exit(1)
  })

  // Ensure the project is a git repo.
  if (!GitUtils.isInitialized()) {
    TerminalUtils.error(
      'Constellate powered publishing requires that your project is initialised as a Git repository.',
    )
    process.exit(1)
  }

  // Ensure there are no uncommitted changes.
  if (GitUtils.uncommittedChanges().length > 0) {
    TerminalUtils.error(
      'You have uncommitted changes. Please commit your changes and then try again.',
    )
    process.exit(1)
  }

  // Ensure on correct branch.
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

  // Get the release version to publish
  // TODO: Allow the user to select/specify this.
  const publishVersionTag = AppUtils.getLastVersionTag()
  if (!publishVersionTag) {
    TerminalUtils.error(
      dedent(`
        You have no releases to publish. Please create a release first.

            ${chalk.blue('npx constellate release')}
      `),
    )
    process.exit(1)
  }

  // Checkout target release to publish
  try {
    GitUtils.checkout(publishVersionTag)
  } catch (err) {
    TerminalUtils.error(`Could not checkout target release ${publishVersionTag}`, err)
    process.exit(1)
  }

  try {
    const publishVersion = publishVersionTag ? semver.clean(publishVersionTag) : '0.0.0'
    TerminalUtils.info(`Resolving projects to publish using publish version of ${publishVersion}`)

    // Get the current versions for each project (will be based within the
    // context of the current checked out version of the repo 👍)
    const currentVersions = allProjectsArray.reduce(
      (acc, cur) => Object.assign(acc, { [cur.name]: ProjectUtils.getLastVersion(cur) }),
      {},
    )

    // Filter the projects down where their current version matches the target
    // deploy version.
    const projectsAtPublishVersion = allProjectsArray
      .filter(project => semver.eq(publishVersion, currentVersions[project.name]))
      .map(R.prop('name'))

    // Ask the user which projects they wish to publish, automatically
    // preselecting the projects which have a version that matches the
    // target version.
    const projectsToPublishNames = await TerminalUtils.multiSelect(
      'Which projects would you like to publish?',
      {
        choices: allProjectsArray.map(p => ({
          checked: R.contains(p.name, projectsAtPublishVersion),
          value: p.name,
          name: `${p.name} (${currentVersions[p.name]})`,
        })),
      },
    )

    TerminalUtils.verbose(`Publishing [${projectsToPublishNames.join(',')}]`)
    const projectsToPublish = projectsToPublishNames.map(n =>
      allProjectsArray.find(R.propEq('name', n)),
    )

    // We need to make sure we have all the deps installed for the projects
    // so that we can build them successfully.
    TerminalUtils.verbose('Installing deps for all projects')
    allProjectsArray.forEach(ProjectUtils.installDeps)

    // Link up all the projects.
    ProjectUtils.linkAllProjects()

    // Build all projects.
    TerminalUtils.verbose('Building all projects')
    await pSeries(allProjectsArray.map(ProjectUtils.compileProject))

    // Upate the package.jsons for each project to be the "publish" ready
    // versions.
    allProjectsArray.forEach(cur => ProjectUtils.createReleasePackageJson(cur, currentVersions))

    // Run any prepublish hooks.
    projectsToPublish.forEach((project) => {
      const compiler = project.compilerPlugin(project)
      if (compiler.prePublish) {
        // TODO: Make this allow promises.
        project.compiler.prePublish(project)
      }
    })

    // 🚀 Publish
    projectsToPublish.forEach((project) => {
      const pkgJson = readPkg.sync(project.paths.packageJson)
      if (pkgJson.private) {
        TerminalUtils.error(`Can't publish ${project.name} as it is marked as private`)
      } else {
        TerminalUtils.info(`Publishing ${project.name}...`)
        ChildProcessUtils.execSync('npm', ['publish'], {
          cwd: project.paths.buildRoot,
        })
      }
    })

    // Run any postpublish hooks.
    projectsToPublish.forEach((project) => {
      const compiler = project.compilerPlugin(project)
      if (compiler.postPublish) {
        // TODO: Make this allow promises.
        project.compiler.postPublish(project)
      }
    })

    TerminalUtils.success('Projects published.')
  } catch (err) {
    TerminalUtils.error('Unexpected error whilst running publish', err)
    TerminalUtils.info(
      'Your projects may not have been fully published. Please check your target publish repository.',
    )
    rollbackChanges()
    process.exit(1)
  }

  // Rollback to previous
  TerminalUtils.info('Rolling repo back to latest...')
  rollbackChanges()
  process.exit(0)
}
