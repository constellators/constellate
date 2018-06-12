const { TerminalUtils, PackageUtils } = require('constellate-dev-utils')
const R = require('ramda')
const pSeries = require('p-series')

module.exports = {
  command: 'clean',
  describe: 'Cleans the build output for packages',
  builder: yargs =>
    yargs.option('packages', {
      alias: 'p',
      describe: 'The packages to clean',
      type: 'array',
    }),
  handler: async argv => {
    try {
      TerminalUtils.title('Running clean...')
      const packages = await PackageUtils.resolvePackages(argv.packages)
      console.log(packages)
      const clean = pkg => () => PackageUtils.cleanPackage(pkg)
      await pSeries(R.values(packages).map(clean))
      TerminalUtils.success('Done')
    } catch (ex) {
      TerminalUtils.error('Clean failed', ex)
    }
  },
}
