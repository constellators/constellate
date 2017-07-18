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

      const alias = options.alias || project.packageName
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

      // const deploymentName = `${process.env.NODE_ENV}-${project.packageName}`

      const args = [
        'deploy',
        // '-n',
        // deploymentName,
        ...envVars,
        '-c',
        nowConfigPath,
        '-C',
        '-t',
        process.env.NOW_TOKEN,
      ]

      TerminalUtils.verbose(`Executing now with args:${EOL}\t[${args}]`)
      TerminalUtils.verbose(`Target deploy path:${EOL}\t${deployPath}`)

      const deploymentUrl = ChildProcessUtils.execSync('now', args, { cwd: deployPath })

      console.log(deploymentUrl)

      await new Promise(resolve => setTimeout(resolve, 5000))

      await ChildProcessUtils.spawn('now', ['alias', 'set', deploymentUrl, alias])

      const scale = async () => {
        await new Promise(resolve => setTimeout(resolve, 5000))
        await ChildProcessUtils.spawn(
          'now',
          [
            'scale',
            deploymentUrl,
            R.path(['scale', 'min'], options) || '1',
            R.path(['scale', 'max'], options),
          ].filter(x => x != null),
        )
      }

      pRetry(scale, { retries: 5 })

      await ChildProcessUtils.spawn('now-purge', ['-t', process.env.NOW_TOKEN, '-n', alias])

      // TODO: purge previous
      // https://github.com/matiastucci/now-purge
    },
  }
}
