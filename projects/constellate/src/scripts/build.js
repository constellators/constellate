// @flow

const pSeries = require('p-series')
const { TerminalUtils, PackageUtils } = require('constellate-dev-utils')
const R = require('ramda')

module.exports = async function build() {
  TerminalUtils.title('Running build...')
  const packages = await PackageUtils.getAllPackages()
  const buildPkg = pkg => () => PackageUtils.buildPackage(pkg)
  await pSeries(R.values(packages).map(buildPkg))
  TerminalUtils.success('Done')
}
