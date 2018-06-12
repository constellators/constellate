// @flow

const { TerminalUtils, PackageUtils } = require('constellate-dev-utils')
const R = require('ramda')
const pSeries = require('p-series')

module.exports = {
  command: 'build',
  desc: 'Executes the configured build plugin for each package',
  handler: async () => {
    try {
      TerminalUtils.title('Running build...')
      const packages = await PackageUtils.getAllPackages()
      const queueBuild = pkg => () => PackageUtils.buildPackage(pkg)
      await pSeries(R.values(packages).map(queueBuild))
      TerminalUtils.success('Done')
    } catch (ex) {
      TerminalUtils.error('Build failed', ex)
    }
  },
}
