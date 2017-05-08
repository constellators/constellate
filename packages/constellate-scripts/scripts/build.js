const R = require('ramda')
const pSeries = require('p-series')

const getPackages = require('../utils/getPackages')
const getPackageBuildOrder = require('../utils/getPackageBuildOrder')
const buildPackage = require('../utils/buildPackage')

// :: Array<PackageInfo>
const packages = getPackages()

// :: string -> PackageInfo
const getPackage = packageName => R.find(R.propEq('name', packageName), packages)

// :: Array<PackageInfo>
const packagesInBuildOrder = R.pipe(getPackageBuildOrder, R.map(getPackage))(packages)

// :: PackageInfo -> void -> Promise<Any>
const queueBuild = packageInfo => () => buildPackage(packageInfo)

pSeries(R.map(queueBuild, packagesInBuildOrder))
  .then(() => console.log('Build complete'))
  .catch(err => console.error(err))
