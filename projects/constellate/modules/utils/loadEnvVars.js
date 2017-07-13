const path = require('path')
const fs = require('fs-extra')
const dotenv = require('dotenv')

const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function loadEnvVars() {
  // First load anv env specific files
  const env = process.env.NODE_ENV || 'production'
  const envSpecificPath = path.resolve(process.cwd(), `./.env.${env}`)
  if (fs.existsSync(envSpecificPath)) {
    TerminalUtils.info(`Loading environment variables from ${envSpecificPath}`)
    dotenv.config({ path: envSpecificPath })
  }

  // Then load any generic .env "overides"
  const envPath = path.resolve(process.cwd(), './.env')
  if (fs.existsSync(envPath)) {
    TerminalUtils.info(`Loading environment variables from ${envPath}`)
    dotenv.config({ path: envPath })
  }
}
