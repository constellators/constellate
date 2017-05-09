const fs = require('fs')
const pathResolve = require('path').resolve
const R = require('ramda')

// :: string -> string -> string
const resolvePackagePath = packageName => relativePath =>
  pathResolve(process.cwd(), `./packages/${packageName}`, relativePath)

// :: string -> PackageInfo
const getPackageInfo = (packageName) => {
  const thisPackagePath = resolvePackagePath(packageName)
  const packageJsonPath = thisPackagePath('./package.json')
  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }))
    : {}
  return {
    name: packageName,
    target: R.path(['constellate', 'target'], packageJson) || 'node',
    role: R.path(['constellate', 'role'], packageJson) || 'library',
    paths: {
      root: thisPackagePath('./'),
      packageJson: packageJsonPath,
      source: thisPackagePath('./modules'),
      sourceEntry: thisPackagePath('./modules/index.js'),
      dist: thisPackagePath('./dist'),
      distEntry: thisPackagePath('./dist/index.js'),
    },
    packageJson,
  }
}

// :: (string, PackageInfo) -> Array<string>
const getDependencies = (dependenciesType, packageInfo) =>
  R.pipe(R.path(['packageJson', dependenciesType]), R.defaultTo({}), R.keys)(packageInfo)

// :: void -> Array<PackageInfo>
module.exports = function getPackages() {
  // :: Array<PackageInfo>
  const packageInfos = fs.readdirSync(pathResolve(process.cwd(), './packages')).map(getPackageInfo)

  // :: Array<String>
  const packageNames = R.map(R.prop('name'), packageInfos)

  // :: String -> Boolean
  const containsPackageName = R.contains(R.__, packageNames)

  // :: PackageInfo -> Array<String>
  const getPackageDependencies = (packageInfo) => {
    const combinedDependencies = R.concat(
      getDependencies('dependencies', packageInfo),
      getDependencies('devDependencies', packageInfo)
    )
    return R.pipe(R.uniq, R.filter(containsPackageName))(combinedDependencies)
  }

  return packageInfos.map(info =>
    Object.assign(info, {
      dependencies: getPackageDependencies(info),
    })
  )
}
