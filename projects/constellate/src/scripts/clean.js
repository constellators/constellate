const { TerminalUtils, PackageUtils } = require('constellate-dev-utils')

module.exports = async options => {
  TerminalUtils.title('Running clean...')

  const packagesToClean = options.packages
    ? await PackageUtils.resolvePackages(options.packages)
    : PackageUtils.getAllPackagesArray()

  await PackageUtils.cleanPackages(packagesToClean)

  TerminalUtils.success('Done')
}
