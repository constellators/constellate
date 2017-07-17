const R = require('ramda')
const semver = require('semver')
const pSeries = require('p-series')
const readPkg = require('read-pkg')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')
const ProjectUtils = require('constellate-dev-utils/modules/projects')

const moveToTargetTag = require('../utils/moveToTargetTag')

module.exports = async function publish() {
  TerminalUtils.title('Running publish...')

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)

  // Ask the user which tag to operate against
  const targetTag = await moveToTargetTag({
    question: 'Which tagged version of the application would you like to publish from?',
  })

  // Get the current versions for each project (will be based within the
  // context of the current checked out version of the repo 👍)
  const currentVersions = allProjectsArray.reduce(
    (acc, cur) => Object.assign(acc, { [cur.name]: ProjectUtils.getLastVersion(cur) }),
    {},
  )

  // Filter the projects down where their current version matches the target
  // deploy version.
  const tagVersion = targetTag ? semver.clean(targetTag) : '0.0.0'
  const projectsAtPublishVersion = allProjectsArray
    .filter(project => semver.eq(tagVersion, currentVersions[project.name]))
    .map(R.prop('name'))

  // Ask the user which projects they wish to publish, automatically
  // preselecting the projects which have a version that matches the
  // target version.
  const projectsToPublishNames = await TerminalUtils.multiSelect(
    `At the application tag ${targetTag} the projects had the following versions. Which of the projects would you like to publish? (Note: if you generally publish your projects after every tag, then you will likely only need to publish the projects that have an equivalent version of the application tag you are targetting)`,
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

  // Run any prepublish hooks on the compiler plugin for each project
  projectsToPublish.forEach((project) => {
    console.log(project)
    const compiler = project.compilerPlugin(project)
    if (compiler.prePublish) {
      // TODO: Make this allow promises.
      compiler.prePublish(project)
    }
  })

  // 🚀 Publish
  projectsToPublish.forEach((project) => {
    const pkgJson = readPkg.sync(project.paths.packageJson)
    if (pkgJson.private) {
      TerminalUtils.warning(`Can't publish ${project.name} as it is marked as private`)
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
      compiler.postPublish(project)
    }
  })

  TerminalUtils.success('Done')
}
