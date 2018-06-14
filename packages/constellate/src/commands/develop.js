// @flow

const { TerminalUtils } = require('constellate-dev-utils')
const developmentService = require('../development-service')
const asyncCommandHandler = require('../utils/async-command-handler')

module.exports = {
  command: 'develop',
  desc: 'Starts the coordinated development service',
  handler: asyncCommandHandler(async () => {
    try {
      TerminalUtils.title('Starting development service...')
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
      }
      await developmentService()
      TerminalUtils.success('Done')
    } catch (ex) {
      TerminalUtils.error('Build failed', ex)
    }
  }),
}
