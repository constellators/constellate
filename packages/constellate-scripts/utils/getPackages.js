const fs = require('fs')
const pathResolve = require('path').resolve
const R = require('ramda')

const defaultConfig = {
  target: 'node',
  role: 'library',
}

// :: string -> string -> string
const resolvePackagePath = packageName => relativePath =>
  pathResolve(process.cwd(), `./packages/${packageName}`, relativePath)

// :: string -> PackageInfo
const getPackageInfo = (packageName) => {
  const thisPackagePath = resolvePackagePath(packageName)
  const packageJsonPath = thisPackagePath('./package.json')
  const constellateConfigPath = thisPackagePath('./constellate.js')
  const config = fs.existsSync(constellateConfigPath)
    ? // eslint-disable-next-line global-require, import/no-dynamic-require
      Object.assign({}, defaultConfig, require(constellateConfigPath)())
    : defaultConfig
  return {
    name: packageName,
    config,
    paths: {
      root: thisPackagePath('./'),
      constellateConfig: constellateConfigPath,
      packageJson: packageJsonPath,
      source: thisPackagePath('./modules'),
      sourceEntry: thisPackagePath('./modules/index.js'),
      dist: thisPackagePath('./dist'),
      distEntry: thisPackagePath('./dist/index.js'),
    },
    packageJson: fs.existsSync(packageJsonPath)
      ? // eslint-disable-next-line global-require, import/no-dynamic-require
        JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }))
      : {},
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
