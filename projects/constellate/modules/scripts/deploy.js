const { EOL } = require('os')
const R = require('ramda')
const dedent = require('dedent')
const fs = require('fs-extra')
const path = require('path')
const pSeries = require('p-series')
const writeJsonFile = require('write-json-file')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')

const moveToTargetTag = require('../utils/moveToTargetTag')
const rollbackRepo = require('../utils/rollbackRepo')

module.exports = async function deploy() {
  TerminalUtils.title('Running deploy...')

  const allProjects = ProjectUtils.getAllProjects()
  const allProjectsArray = R.values(allProjects)

  // Ask the user which tag to operate against
  const targetTag = await moveToTargetTag({
    question: 'Which version of the application would you like to deploy from?',
  })

  TerminalUtils.info(`Moving repo to ${targetTag} to determine project versions`)

  // Get the current versions for each project (will be based within the
  // context of the current checked out version of the repo 👍)
  const currentVersions = allProjectsArray.reduce(
    (acc, cur) => Object.assign(acc, { [cur.name]: cur.version }),
    {},
  )

  TerminalUtils.info(
    dedent(`
    Resolved project versions as:

    \t${Object.keys(currentVersions)
      .map(name => `- ${name}@${currentVersions[name]}`)
      .join(`${EOL}\t`)}
  `),
  )

  TerminalUtils.info('Rolling back repo to current and prepping for deployment...')

  rollbackRepo()

  const projectsToDeploy = allProjectsArray.filter(project => project.deployPlugin)

  // TODO: Allow them to select which projects they would like to deploy
  TerminalUtils.info(
    dedent(`
    The following projects will be deployed:

    \t${projectsToDeploy.map(x => `- ${x.name}`).join(`${EOL}\t`)}
  `),
  )

  await pSeries(
    projectsToDeploy.map(project => async () => {
      const installRoot = path.resolve(process.cwd(), `./deploy/${project.name}`)
      fs.ensureDirSync(installRoot)
      const tempPkgJson = { name: `deploy-${project.name}`, private: true }
      const tempPkgJsonPath = path.resolve(installRoot, './package.json')
      writeJsonFile.sync(tempPkgJsonPath, tempPkgJson)
      ChildProcessUtils.execSync(
        'npm',
        ['install', `${project.packageName}@${currentVersions[project.name]}`],
        { cwd: installRoot },
      )
      const deployRoot = path.resolve(installRoot, `./node_modules/${project.packageName}`)
      await project.deployPlugin(deployRoot, project.config.deployOptions || {}, project).deploy()
    }),
  )

  TerminalUtils.success('Done')
}

// TODO
// - Checkout target release
// - Build projects.
// - Locate each one with a deploy to now and then deploy in order.
// - Done.
