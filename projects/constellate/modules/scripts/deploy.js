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

  TerminalUtils.info('Resolving projects at version that can be deployed...')

  TerminalUtils.verbose(`Moving repo to ${targetTag} to determine project versions`)

  // Get the current versions for each project (will be based within the
  // context of the current checked out version of the repo 👍)
  const currentVersions = allProjectsArray.reduce(
    (acc, cur) => Object.assign(acc, { [cur.name]: cur.version }),
    {},
  )

  TerminalUtils.verbose(
    dedent(`
    Resolved project versions as:
    \t${Object.keys(currentVersions)
      .map(name => `- ${name}@${currentVersions[name]}`)
      .join(`${EOL}\t`)}
  `),
  )

  TerminalUtils.verbose('Rolling back repo to current and prepping for deployment...')
  rollbackRepo({ quiet: true })

  const projectsWithDeployConfig = allProjectsArray.filter(project => project.deployPlugin)
  if (projectsWithDeployConfig.length === 0) {
    TerminalUtils.info('You do not have any projects with a deploy configuration.  Exiting...')
    process.exit(0)
  }

  const namesOfProjectsToDeploy = await TerminalUtils.multiSelect(
    'Which projects would you like to deploy?',
    {
      choices: projectsWithDeployConfig.map(x => ({
        value: x.name,
        text: `${x.name} (${x.version})`,
      })),
    },
  )

  if (namesOfProjectsToDeploy.length === 0) {
    TerminalUtils.info('No projects selected. Exiting...')
    process.exit(0)
  }

  const projectsToDeploy = namesOfProjectsToDeploy.map(x => allProjects[x])

  TerminalUtils.info('Deploying selected projects...')

  const deployRootPath = path.resolve(process.cwd(), './deploy')

  await pSeries(
    projectsToDeploy.map(project => async () => {
      const installRoot = path.resolve(deployRootPath, `./${project.name}`)
      fs.ensureDirSync(installRoot)
      const tempPkgJson = { name: `deploy-${project.name}`, private: true }
      const tempPkgJsonPath = path.resolve(installRoot, './package.json')
      writeJsonFile.sync(tempPkgJsonPath, tempPkgJson)
      ChildProcessUtils.execSync(
        'npm',
        ['install', `${project.packageName}@${currentVersions[project.name]}`],
        {
          cwd: installRoot,
        },
      )
      const deployRoot = path.resolve(installRoot, `./node_modules/${project.packageName}`)
      await project.deployPlugin(deployRoot, project.config.deployOptions || {}, project).deploy()
    }),
  )

  TerminalUtils.verbose('Cleaning deploy dir')
  fs.removeSync(deployRootPath)

  TerminalUtils.success('Done')
}
