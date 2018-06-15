const { EOL } = require('os')
const R = require('ramda')
const dedent = require('dedent')
const fs = require('fs-extra')
const path = require('path')
const pSeries = require('p-series')
const writeJsonFile = require('write-json-file')
const {
  TerminalUtils,
  ChildProcessUtils,
  PackageUtils,
} = require('constellate-dev-utils')
const moveToTargetTag = require('../utils/moveToTargetTag')
const rollbackRepo = require('../utils/rollbackRepo')

module.exports = async function deploymentService() {
  const allPackages = PackageUtils.getAllPackages()
  const allPackagesArray = R.values(allPackages)

  let currentVersions

  try {
    // Ask the user which tag to operate against
    const targetTag = await moveToTargetTag({
      question:
        'Which version of the application would you like to deploy from?',
    })

    TerminalUtils.info('Resolving packages at version that can be deployed...')

    TerminalUtils.verbose(
      `Moving repo to ${targetTag} to determine package versions`,
    )

    // Get the current versions for each package (will be based within the
    // context of the current checked out version of the repo 👍)
    currentVersions = allPackagesArray.reduce(
      (acc, cur) => Object.assign(acc, { [cur.name]: cur.version }),
      {},
    )

    TerminalUtils.verbose(
      dedent(`
    Resolved package versions as:
    \t${Object.keys(currentVersions)
      .map(name => `- ${name}@${currentVersions[name]}`)
      .join(`${EOL}\t`)}
  `),
    )
  } catch (err) {
    TerminalUtils.verbose(
      'Rolling back repo to current and prepping for deployment...',
    )
    rollbackRepo({ quiet: true })
    throw err
  }

  /*
  TerminalUtils.verbose(
    'Rolling back repo to current and prepping for deployment...',
  )
  rollbackRepo({ quiet: true })
  */

  const rollbackExit = code => {
    rollbackRepo({ quiet: true })
    process.exit(code)
  }

  const packagesWithDeployConfig = allPackagesArray.filter(
    pkg => pkg.deployPlugin,
  )
  if (packagesWithDeployConfig.length === 0) {
    TerminalUtils.info(
      'You do not have any packages with a deploy configuration.  Exiting...',
    )
    rollbackExit(0)
  }

  const namesOfPackagesToDeploy = await TerminalUtils.multiSelect(
    'Which packages would you like to deploy?',
    {
      choices: packagesWithDeployConfig.map(x => ({
        value: x.name,
        text: `${x.name} (${x.version})`,
      })),
    },
  )

  if (namesOfPackagesToDeploy.length === 0) {
    TerminalUtils.info('No packages selected. Exiting...')
    rollbackExit(0)
  }

  await ChildProcessUtils.exec('yarn', ['install'])

  const packagesToDeploy = namesOfPackagesToDeploy.map(x => allPackages[x])

  TerminalUtils.info('Deploying selected packages...')

  // const deployRootPath = path.resolve(process.cwd(), './deploy')

  await pSeries(
    packagesToDeploy.map(pkg => async () => {
      /*
      const installRoot = path.resolve(deployRootPath, `./${package.name}`)
      fs.ensureDirSync(installRoot)
      const tempPkgJson = { name: `deploy-${package.name}`, private: true }
      const tempPkgJsonPath = path.resolve(installRoot, './package.json')
      writeJsonFile.sync(tempPkgJsonPath, tempPkgJson)
      ChildProcessUtils.execSync(
        'yarn',
        ['install', `${package.packageName}@${currentVersions[package.name]}`],
        {
          cwd: installRoot,
        },
      )
      const deployRoot = path.resolve(
        installRoot,
        `./node_modules/${package.packageName}`,
      )
      */
      await pkg.plugins.deployPlugin.deploy()
    }),
  )

  // TerminalUtils.verbose('Cleaning deploy dir')
  // fs.removeSync(deployRootPath)

  TerminalUtils.success('Done')
}
