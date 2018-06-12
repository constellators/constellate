// @flow

const { TerminalUtils } = require('constellate-dev-utils')
const deploymentService = require('../deployment-service')

module.exports = {
  command: 'deploy',
  desc: 'Executes the deployment process',
  handler: async () => {
    try {
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'production'
      }
      TerminalUtils.title('Running deploy...')
      await deploymentService()
      TerminalUtils.success('Done')
    } catch (ex) {
      TerminalUtils.error('Deployment failed', ex)
    }
  },
}
