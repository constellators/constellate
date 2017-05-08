const toposort = require('toposort')
const R = require('ramda')

const packageDependencyGraph = packageInfo =>
  R.pipe(R.prop('dependencies'), R.map(dependency => [dependency, packageInfo.name]))(packageInfo)

// :: Array<PackageInfo> -> Array<Array<string, string>>
const dependencyGraph = R.chain(packageDependencyGraph)

// :: Array<PackageInfo> -> Array<string>
module.exports = function getPackageBuildOrder(packages) {
  return R.pipe(dependencyGraph, x => console.log('GRAPH', x) || x, toposort)(packages)
}
