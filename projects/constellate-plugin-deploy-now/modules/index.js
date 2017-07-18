const { EOL } = require('os')
const tempWrite = require('temp-write')
const writeJsonFile = require('write-json-file')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ChildProcessUtils = require('constellate-dev-utils/modules/childProcess')

module.exports = function nowDeploy(deployPath, options, project) {
  /*
  if (process.env.NOW_LOGIN == null) {
    TerminalUtils.error('You must supply your "now" login id via a NOW_LOGIN environment variable.')
    process.exit(1)
  }

  if (process.env.NOW_TOKEN == null) {
    TerminalUtils.error(
      'You must supply your "now" API token via a NOW_TOKEN environment variable.',
    )
    process.exit(1)
  }
  */

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

      const createNowConfig = () => {
        const tempFilePath = tempWrite.sync()
        writeJsonFile.sync(tempFilePath, options.nowConfig)
        return ['-c', tempFilePath]
      }

      const configArgs = options.nowConfig ? createNowConfig() : []

      const args = [
        'deploy',
        '-n',
        alias,
        ...envVars,
        ...configArgs,
        '-C',
        // '-L',
        // process.env.NOW_LOGIN,
        // '-t',
        // process.env.NOW_TOKEN,
      ]

      TerminalUtils.verbose(`Executing now with args:${EOL}\t[${args}]`)
      TerminalUtils.verbose(`Target deploy path:${EOL}\t${deployPath}`)

      await ChildProcessUtils.spawn('now', args, { cwd: deployPath })
    },
  }
}

// TODO
// - now deploy -N -n constellate-{config.name} -e FOO=bar -e BAZ=qux {config.paths.buildRoot}
// - now alias constellate-{project.name} ${config.deployOptions[env].alias}

/*
Syntax	Description
now deploy [path]	When you invoke now, the files within the current directory will be uploaded to now and a new deployment will be created. After that, you'll instantly receive its URL so that you can share it with other people around the globe.
now ls|list [app]	Show a list of all deployments. If [app] is defined, it will only list the deployments under that namespace.
now rm|remove [id]	Remove a deployment from our platform. The [id] parameter can either be the URL of your deployment (e.g. https://static-ytbbrhoggd.now.sh or the hostname (e.g. static-ytbbrhoggd.now.sh).
now ln|alias [id] [url]	Let's you configure an alias for an existing deployment. You can read more about how to take the maximum of functionality out of this sub command here.
now domains [name]	Allows you to manage your domain names directly from the command line (before using them as aliases with now alias). Read more about it here.
now certs [cmd]	By default, now will automatically provision certificates for your deployments. Using this sub command, you can see when they're expiring and upload your own ones (read more).
now secrets [name]	Read more
now dns [name]	Read more
now open	Running this sub command will open the latest deployment of the project within the current directory in your default browser (aliases won't be respected).
*/
