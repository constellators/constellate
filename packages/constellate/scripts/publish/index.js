const { EOL } = require('os')
const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/terminal')
const GitUtils = require('constellate-dev-utils/git')
const ChildProcessUtils = require('constellate-dev-utils/childProcess')
const AppUtils = require('../../utils/app')
const ProjectUtils = require('../../utils/projects')
const requestNextVersion = require('./requestNextVersion')

module.exports = function publish(allProjects, projectsToPublish) {
  if (!GitUtils.isInitialized()) {
    TerminalUtils.error(
      'Constellate publishing requires that your project is initialised as a Git repository.'
    )
    process.exit(1)
  }

  const constellateAppConfig = AppUtils.getConfig()
  const lastVersionTag = AppUtils.getLastVersionTag()
  const lastVersion = lastVersionTag ? semver.clean(lastVersionTag) : '0.0.0'
  TerminalUtils.verbose(`Last version is ${lastVersion}`)

  // Ensure there are no uncommitted changes
  const projectsWithUncommitedChanges = allProjects.filter(ProjectUtils.hasUncommittedChanges)
  if (projectsWithUncommitedChanges.length > 0) {
    TerminalUtils.error(
      `The following projects have uncommitted changes within them. Please commit your changes and then try again.${EOL}${projectsWithUncommitedChanges
        .map(R.prop('name'))
        .join(', ')}`
    )
    process.exit(1)
  }

  // Ensure on correct branch
  const targetBranch = R.path(['publishing', 'git', 'branch'], constellateAppConfig) || 'master'
  const actualBranch = GitUtils.getCurrentBranch()
  if (targetBranch !== actualBranch) {
    try {
      GitUtils.checkout(targetBranch)
    } catch (err) {
      TerminalUtils.error(`Could not switch to the publish branch (${targetBranch})`)
    }
  }

  // Ask for the next version
  return requestNextVersion(lastVersion).then((nextVersion) => {
    const isFirstPublish = lastVersion === '0.0.0'

    const toPublish = isFirstPublish
      ? // We will publish all the ProjectUtils as this is our first publish.
        allProjects
      : projectsToPublish.filter(ProjectUtils.changedSince(lastVersionTag))

    const versions = Object.assign(
      {},
      allProjects.reduce(
        (acc, cur) => Object.assign(acc, { [cur.name]: ProjectUtils.getLastVersion(cur) }),
        {}
      ),
      toPublish.reduce((acc, cur) => Object.assign(acc, { [cur.name]: nextVersion }), {})
    )

    if (toPublish.length === 0) {
      TerminalUtils.info('There are no changes to be published.')
      return undefined
    }

    // :: Project -> void -> Promise
    const queueBuild = toBuild => () =>
      ProjectUtils.buildProject(allProjects, toBuild, { versions })

    return pSeries(toPublish.map(queueBuild)).then(() => {
      toPublish.forEach((project) => {
        const pkgJson = readPkg.sync(project.paths.packageJson)
        if (pkgJson.private) {
          TerminalUtils.verbose(`Skipping publish of ${project.name} as it is marked as private`)
          return
        }
        TerminalUtils.info(`Publishing ${project.name}...`)
        try {
          ChildProcessUtils.execSync('npm', ['publish'], {
            cwd: project.paths.buildRoot,
          })
        } catch (err) {
          // TODO: Unpublish any previously published versions?
          TerminalUtils.error(`Failed to publish ${project.name}`, err)
        }
      })

      // TODO: Assign the git tag and push the repo.
    })
  })
}
