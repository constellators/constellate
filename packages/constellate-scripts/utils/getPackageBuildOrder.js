const toposort = require('toposort')
const R = require('ramda')

const packageDependencyGraph = packageInfo =>
  R.pipe(R.prop('dependencies'), R.map(dependency => [dependency, packageInfo.name]))(packageInfo)

// :: Array<PackageInfo> -> Array<Array<string, string>>
const dependencyGraph = R.chain(packageDependencyGraph)

// :: PackageInfo -> bool
const hasNoDependencies = ({ dependencies }) => dependencies.length === 0

// :: Array<PackageInfo> -> Array<string>
module.exports = function getPackageBuildOrder(packages) {
  const packagesWithNoDependencies = R.pipe(R.filter(hasNoDependencies), R.map(R.prop('name')))(
    packages
  )
  return R.pipe(
    dependencyGraph,
    toposort,
    R.without(packagesWithNoDependencies),
    R.concat(packagesWithNoDependencies)
  )(packages)
}
