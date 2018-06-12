// @flow

const { TerminalUtils } = require('constellate-dev-utils')
const developmentService = require('../development-service')
const preventScriptExit = require('../utils/prevent-script-exit')

module.exports = {
  command: 'develop',
  desc: 'Starts the coordinated development service',
  handler: async () => {
    try {
      TerminalUtils.title('Starting development service...')
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
      }
      await developmentService()
      preventScriptExit()
      TerminalUtils.success('Done')
    } catch (ex) {
      TerminalUtils.error('Build failed', ex)
    }
  },
}
