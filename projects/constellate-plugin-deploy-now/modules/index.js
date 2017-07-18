const TerminalUtils = require('constellate-dev-utils/modules/terminal')

if (process.env.NOW_TOKEN == null) {
  TerminalUtils.error('You must supply your "now" API token via a NOW_TOKEN environment variable.')
  process.exit(1)
}

module.exports = function nowDeploy(path, options, project) {
  // TODO
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
