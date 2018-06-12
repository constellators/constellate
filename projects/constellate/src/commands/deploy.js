// @flow

const { TerminalUtils, PackageUtils } = require('constellate-dev-utils')
const R = require('ramda')
const pSeries = require('p-series')
const deploymentService = require('../deployment-service')

module.exports = {
  command: 'deploy',
  desc: 'Executes the deployment process',
  handler: async () => {
    try {
      TerminalUtils.title('Running deploy...')
      await deploymentService()
      TerminalUtils.success('Done')
    } catch (ex) {
      TerminalUtils.error('Deployment failed', ex)
    }
  },
}
