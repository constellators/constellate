const R = require('ramda')
const pWhilst = require('p-whilst')
const dedent = require('dedent')
const chalk = require('chalk')
const deepMerge = require('deepmerge')
const tempWrite = require('temp-write')
const writeJsonFile = require('write-json-file')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')

module.exports = function nowDeploy(deployPath, options, project) {
  if (process.env.NOW_USERNAME == null) {
    TerminalUtils.error(
      'In order to deploy to "now" you must supply your "now" username via a NOW_USERNAME environment variable.',
    )
    process.exit(1)
  }

  if (process.env.NOW_TOKEN == null) {
    TerminalUtils.error(
      'In order to deploy to "now" you must supply your "now" API token via a NOW_TOKEN environment variable.',
    )
    process.exit(1)
  }

  if (R.isNil(options.alias) || R.isEmpty(options.alias)) {
    TerminalUtils.error('You must supply an "alias" for the "now" deploy plugin.')
    process.exit(1)
  }

  return {
    deploy: async () => {
      try {
        ChildProcessUtils.execSync('now', ['-v'])
      } catch (err) {
        TerminalUtils.error(
          'You need to have the "now" CLI installed on your machine and available on your PATH in order to deploy to now.',
        )
        throw err
      }

      const deploymentName = project.packageName

      const alias = options.alias
      const envVars = options.passThroughEnvVars
        ? options.passThroughEnvVars.reduce(
            (acc, cur) => [...acc, '-e', `${cur}=${process.env[cur]}`],
            [],
          )
        : []

      const nowConfigPath = tempWrite.sync()
      const nowConfig = deepMerge(
        deepMerge(
          // Defaults
          {
            forwardNpm: true,
            public: false,
          },
          // User overrides
          options.nowConfig || {},
        ),
        // Fixed - these must be provided via the env for forced safety
        {
          token: process.env.NOW_TOKEN,
          user: {
            username: process.env.NOW_USERNAME,
          },
        },
      )
      writeJsonFile.sync(nowConfigPath, nowConfig)

      const args = [
        'deploy',
        '-n',
        deploymentName,
        ...envVars,
        '-c',
        nowConfigPath,
        '-C',
        '-t',
        process.env.NOW_TOKEN,
      ]

      TerminalUtils.verbose(`Deploy path: ${deployPath}`)

      const deployResponse = await ChildProcessUtils.exec('now', args, { cwd: deployPath })
      const deploymentIdRegex = /(https:\/\/.+\.now\.sh)/g
      if (!deploymentIdRegex.test(deployResponse)) {
        // Todo error
        process.exit(1)
      }
      const deploymentId = deployResponse.match(deploymentIdRegex)[0]
      TerminalUtils.info(`Creating deployment (${deploymentId}) for ${project.name}...`)

      // Now we need to wait for the deployment to be ready.

      let ready = false

      setTimeout(() => {
        if (ready) {
          return
        }
        TerminalUtils.error(
          dedent(`
          The deployment process timed out. :( There may be an issue with your deployment or with "now". You could try to manually deploy using the following commands to gain more insight into the issue:

            ${chalk.blue(`cd ${deployPath}`)}
            ${chalk.blue(`now ${args.join(' ')}`)}
          `),
        )
        process.exit(1)
      }, (options.deployTimeoutMins || 15) * 60 * 1000)

      await pWhilst(
        () => !ready,
        async () => {
          // we will check the status for the deployment every 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5 * 1000))
          const status = ChildProcessUtils.execSync('now', ['ls', deploymentId])
          if (/READY/.test(status)) {
            ready = true
          }
        },
      )

      TerminalUtils.info(`Setting alias for new deployment of ${project.name} to ${alias}....`)
      await ChildProcessUtils.exec('now', ['alias', 'set', deploymentId, alias])

      const minScale = R.path(['scale', 'min'], options)
      if (minScale) {
        const maxScale = R.path(['scale', 'max'], options)
        TerminalUtils.info(
          `Setting the scale factor for new deployment of ${project.name} to ${minScale} ${maxScale ||
            ''}....`,
        )
        await ChildProcessUtils.exec(
          'now',
          ['scale', deploymentId, minScale, maxScale].filter(x => x != null),
        )
      }

      if (options.aliasRules) {
        TerminalUtils.info('Applying alias rules...')
        const aliasRulesPath = tempWrite.sync()
        writeJsonFile.sync(aliasRulesPath, { rules: options.aliasRules })
        await ChildProcessUtils.exec('now', ['alias', alias, '-r', aliasRulesPath])
      }

      if (!options.disableRemovePrevious) {
        // Removes previous deployments 👍
        try {
          // TODO: I think this is hanging the proc. Maybe switch to sync execs
          await ChildProcessUtils.exec('now', ['rm', deploymentName, '--safe', '-y'])
        } catch (err) {
          TerminalUtils.verbose(
            'Failed to remove previous deployments. There may not be any available.',
          )
          TerminalUtils.verbose(err)
        }
      }

      TerminalUtils.success(`${project.name} has been successfully deployed`)
    },
  }
}
