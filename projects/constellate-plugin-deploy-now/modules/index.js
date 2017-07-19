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

  if (!options.alias) {
    TerminalUtils.error('You must supply an "alias" name as options to the "now" deploy plugin')
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

      const args = ['deploy', ...envVars, '-c', nowConfigPath, '-C', '-t', process.env.NOW_TOKEN]

      TerminalUtils.verbose(`Executing now with args:${EOL}\t[${args}]`)
      TerminalUtils.verbose(`Target deploy path:${EOL}\t${deployPath}`)

      TerminalUtils.info(`Deploying ${project.name} to now....`)
      const deploymentUrl = ChildProcessUtils.execSync('now', args, { cwd: deployPath })
      TerminalUtils.verbose(`Now deployment for ${project.name} created at ${deploymentUrl}`)

      TerminalUtils.info(`Setting alias for new deployment of ${project.name} to ${alias}....`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      await ChildProcessUtils.execSync('now', ['alias', 'set', deploymentUrl, alias])

      const minScale = R.path(['scale', 'min'], options) || '1'
      const maxScale = R.path(['scale', 'max'], options)
      TerminalUtils.info(
        `Setting the scale factor for new deployment of ${project.name} to ${minScale} ${maxScale ||
          ''}....`,
      )
      const scale = async () => {
        TerminalUtils.verbose('Trying to set scale factor for deployment')
        await new Promise(resolve => setTimeout(resolve, 5000))
        await ChildProcessUtils.execSync(
          'now',
          ['scale', deploymentUrl, minScale, maxScale].filter(x => x != null),
        )
      }

      await pRetry(scale, { retries: 5 })

      if (options.aliasRules) {
        TerminalUtils.info('Applying alias rules...')
        const aliasRulesPath = tempWrite.sync()
        writeJsonFile.sync(aliasRulesPath, options.aliasRules)
        await ChildProcessUtils.execSync('now', ['alias', alias, '-r', aliasRulesPath])
      }

      TerminalUtils.success(`${project.name} has been successfully deployed`)
      TerminalUtils.info(
        'We recommend that you remove your previous deployments using a tool like now-purge',
      )
    },
  }
}
