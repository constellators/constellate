const R = require('ramda')
const { EOL } = require('os')
const pRetry = require('p-retry')
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

      TerminalUtils.verbose(`Executing now with args:${EOL}\t[${args}]`)
      TerminalUtils.verbose(`Target deploy path:${EOL}\t${deployPath}`)

      TerminalUtils.info(`Deploying ${project.name} to now....`)
      const deploymentUrl = await ChildProcessUtils.exec('now', args, { cwd: deployPath })
      TerminalUtils.verbose(`Now deployment for ${project.name} created at ${deploymentUrl}`)

      TerminalUtils.info(`Setting alias for new deployment of ${project.name} to ${alias}....`)
      const setAlias = async () => {
        await new Promise(resolve => setTimeout(resolve, 5000))
        await ChildProcessUtils.exec('now', ['alias', 'set', deploymentUrl, alias])
      }
      await pRetry(setAlias, { retries: 12 })

      const minScale = R.path(['scale', 'min'], options) || '1'
      const maxScale = R.path(['scale', 'max'], options)
      TerminalUtils.info(
        `Setting the scale factor for new deployment of ${project.name} to ${minScale} ${maxScale ||
          ''}....`,
      )
      const setScale = async () => {
        TerminalUtils.verbose('Trying to set scale factor for deployment')
        await new Promise(resolve => setTimeout(resolve, 5000))
        await ChildProcessUtils.exec(
          'now',
          ['scale', deploymentUrl, minScale, maxScale].filter(x => x != null),
        )
      }
      await pRetry(setScale, { retries: 12 })

      if (options.aliasRules) {
        TerminalUtils.info('Applying alias rules...')
        const aliasRulesPath = tempWrite.sync()
        writeJsonFile.sync(aliasRulesPath, { rules: options.aliasRules })
        await ChildProcessUtils.exec('now', ['alias', alias, '-r', aliasRulesPath])
      }

      if (!options.disableRemovePrevious) {
        // Removes previous deployments 👍
        try {
          await ChildProcessUtils.exec('now', ['rm', deploymentName, '--safe'])
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
