// @flow

import type { PackageMap } from '../types'

const { EOL } = require('os')
const fs = require('fs-extra')
const path = require('path')
const toposort = require('toposort')
const readPkg = require('read-pkg')
const R = require('ramda')
const TerminalUtils = require('../terminal')
const AppUtils = require('../app')
const ObjectUtils = require('../objects')
const ColorUtils = require('../colors')
const resolvePlugin = require('../plugins/resolvePlugin')
const resolvePackageRoots = require('./resolve-package-roots')

let cache = null

const defaultPackageConfig = {
  srcDir: 'src',
  entryFile: 'index.js',
  outputDir: 'build',
  buildPlugin: null,
  developPlugin: 'build-develop',
  deployPlugin: null,
  dependencies: [],
}

// :: Package -> Array<string>
const allDeps = pkg =>
  (pkg.dependencies || [])
    .concat(pkg.devDependencies || [])
    .concat(pkg.softDependencies || [])

// :: Package -> Array<string>
const linkDeps = pkg =>
  (pkg.dependencies || []).concat(pkg.devDependencies || [])

// :: string -> Package
const toPackage = packagePath => {
  const appConfig = AppUtils.getConfig()
  const packageJsonPath = path.resolve(packagePath, './package.json')
  if (!fs.pathExistsSync(packageJsonPath)) {
    TerminalUtils.error(
      `No package.json file found for package at ${packagePath}`,
    )
    process.exit(1)
  }
  const packageJson = readPkg.sync(packageJsonPath, { normalize: false })
  const packageName = packageJson.name
  const config = ObjectUtils.mergeDeep(
    defaultPackageConfig,
    R.path(['packages', packageName], appConfig) || {},
  )
  return {
    name: packageName,
    color: ColorUtils.nextColorPair(),
    config,
    packageJson,
    packageName: packageJson.name,
    version: packageJson.version || '0.0.0',
    paths: {
      monoRepoRoot: process.cwd(),
      monoRepoRootNodeModules: path.resolve(process.cwd(), './node_modules'),
      packageBuildOutput: path.resolve(packagePath, config.outputDir),
      packageSrc: path.resolve(packagePath, config.srcDir),
      packageEntryFile: path.resolve(
        packagePath,
        config.srcDir,
        config.entryFile,
      ),
      packageJson: packageJsonPath,
      packageLockJson: path.resolve(packagePath, './package-lock.json'),
      packageNodeModules: path.resolve(packagePath, './node_modules'),
      packageRoot: packagePath,
      packageWebpackCache: path.resolve(packagePath, './.webpackcache'),
    },
  }
}

const resolvePluginFor = (pkg, type) => {
  const pluginDef = pkg.config[type]
  if (pluginDef == null) {
    return null
  }
  const config = Array.isArray(pluginDef)
    ? {
        name: pluginDef[0],
        options: pluginDef.length > 1 ? pluginDef[1] : {},
      }
    : { name: pluginDef, options: {} }
  const pluginFactory = resolvePlugin(config.name)
  return pluginFactory(pkg, config.options)
}

function getPlugins(pkg) {
  return {
    buildPlugin: resolvePluginFor(pkg, 'buildPlugin'),
    developPlugin: resolvePluginFor(pkg, 'developPlugin'),
    deployPlugin: resolvePluginFor(pkg, 'deployPlugin'),
  }
}

// :: Array<Package> -> Array<Package>
function orderByDependencies(packages) {
  const packageDependencyGraph = pkg =>
    R.pipe(
      allDeps,
      R.map(dependencyName => [dependencyName, pkg.name]),
    )(pkg)

  // :: Array<Package> -> Array<Array<string, string>>
  const dependencyGraph = R.chain(packageDependencyGraph)

  // :: Package -> bool
  const hasNoDependencies = ({ dependencies }) => dependencies.length === 0

  // :: Array<Package>
  const packagesWithNoDependencies = R.pipe(
    R.filter(hasNoDependencies),
    R.map(R.prop('name')),
  )(packages)

  // :: string -> Package
  const findPackageByName = R.map(name =>
    R.find(R.propEq('name', name), packages),
  )

  return R.pipe(
    dependencyGraph,
    toposort,
    R.without(packagesWithNoDependencies),
    R.concat(packagesWithNoDependencies),
    findPackageByName,
  )(packages)
}

/**
 * Gets all the packages for the constellate application.
 *
 * The packages are ordered based on their dependency graph.
 * i.e. build them in order.
 *
 * @return {Array<Package>} The package meta object
 */
module.exports = async function getAllPackages(
  skipCache: ?boolean,
): PackageMap {
  if (!skipCache && cache) {
    return cache
  }

  TerminalUtils.verbose('Resolving package data from disk')

  const appConfig = AppUtils.getConfig()
  const packagePaths = await resolvePackageRoots(appConfig.packageSources)

  // convert into a Package
  const packages = packagePaths.map(toPackage)

  const maxPackageNameLength = Math.max(...packages.map(x => x.name.length))

  packages.forEach(x => {
    // eslint-disable-next-line no-param-reassign
    x.maxPackageNameLength = maxPackageNameLength
  })

  // :: Package -> Array<string>
  const getSoftDependencies = pkg =>
    (pkg.config.softDependencies || []).reduce((acc, dependencyName) => {
      const dependency = R.find(R.propEq('name', dependencyName), packages)
      if (!dependency) {
        TerminalUtils.warning(
          `Could not find ${dependencyName} referenced as soft dependency for ${
            pkg.name
          }`,
        )
        return acc
      }
      return acc.concat([dependencyName])
    }, [])

  // :: (Package, string) -> Array<string>
  const getDependencies = (allPackages, pkg, dependencyType) => {
    const targetDependencies = R.path(['packageJson', dependencyType], pkg)
    if (!targetDependencies) {
      return []
    }
    return Object.keys(targetDependencies).reduce((acc, cur) => {
      const match = allPackages.find(x => x.packageName === cur)
      return match ? [...acc, match.name] : acc
    }, [])
  }

  // :: -> Array<string>
  const getDependants = (allPackages, pkg) =>
    allPackages
      .filter(x => R.contains(pkg.name, allDeps(x)))
      .map(R.prop('name'))

  // :: -> Array<string>
  const getLinkedDependants = (allPackages, pkg) =>
    allPackages
      .filter(x => R.contains(pkg.name, linkDeps(x)))
      .map(R.prop('name'))

  // TODO: getAllDependants and getAllLinkedDependants can be generalised.

  // :: -> Array<string>
  const getAllDependants = (allPackages, pkg) => {
    const findPackage = name => R.find(R.propEq('name', name), allPackages)

    // :: String -> Array<String>
    const resolveDependants = dependantName => {
      const dependant = findPackage(dependantName)
      return [
        dependant.name,
        ...dependant.dependants,
        ...R.map(resolveDependants, dependant.dependants),
      ]
    }

    const allDependants = R.chain(resolveDependants, pkg.dependants)

    // Let's get a sorted version of allDependants by filtering allPackages
    // which will already be in a safe build order.
    return allPackages
      .filter(x => !!R.find(R.equals(x.name), allDependants))
      .map(R.prop('name'))
  }

  // :: -> Array<string>
  const getAllLinkedDependants = (allPackages, pkg) => {
    const findPackage = name => R.find(R.propEq('name', name), allPackages)

    // :: String -> Array<String>
    const resolveLinkedDependants = dependantName => {
      const dependant = findPackage(dependantName)
      return [
        dependant.name,
        ...dependant.linkedDependants,
        ...R.map(resolveLinkedDependants, dependant.linkedDependants),
      ]
    }

    const allLinkedDependants = R.chain(
      resolveLinkedDependants,
      pkg.linkedDependants,
    )

    // Let's get a sorted version of allDependants by filtering allPackages
    // which will already be in a safe build order.
    return allPackages
      .filter(x => !!R.find(R.equals(x.name), allLinkedDependants))
      .map(R.prop('name'))
  }

  cache = R.pipe(
    // The packages this package directly depends on.
    allPackages =>
      R.map(pkg => {
        const dependencies = getDependencies(allPackages, pkg, 'dependencies')
        const devDependencies = getDependencies(
          allPackages,
          pkg,
          'devDependencies',
        )
        const softDependencies = getSoftDependencies(pkg)
        return Object.assign({}, pkg, {
          dependencies,
          devDependencies,
          softDependencies,
        })
      })(allPackages),
    // Packages that directly depend (via link) on this package.
    allPackages =>
      R.map(pkg =>
        Object.assign({}, pkg, {
          linkedDependants: getLinkedDependants(allPackages, pkg),
        }),
      )(allPackages),
    // Packages that directly depend (via link or soft dep) on this package.
    allPackages =>
      R.map(pkg =>
        Object.assign({}, pkg, {
          dependants: getDependants(allPackages, pkg),
        }),
      )(allPackages),
    // Packages ordered based on their dependencies (via link or soft dep)
    // based order, which mean building them in order should be safe.
    orderByDependencies,
    // Add the FULL linked dependant tree
    allPackages =>
      R.map(pkg =>
        Object.assign(pkg, {
          allLinkedDependants: getAllLinkedDependants(allPackages, pkg),
        }),
      )(allPackages),
    // Add the FULL dependant tree
    allPackages =>
      R.map(pkg =>
        Object.assign(pkg, {
          allDependants: getAllDependants(allPackages, pkg),
        }),
      )(allPackages),
    // Attach Plugins
    allPackages =>
      R.map(pkg =>
        Object.assign(pkg, {
          plugins: getPlugins(pkg),
        }),
      )(allPackages),
    // Verbose logging
    R.map(pkg => {
      TerminalUtils.verbose(
        `Resolved package ${pkg.name}:${EOL}${JSON.stringify(
          R.omit(['packageJson'], pkg),
          null,
          2,
        )}`,
      )
      return pkg
    }),
    // Convert into an object map
    R.reduce((acc, cur) => Object.assign(acc, { [cur.name]: cur }), {}),
  )(packages)

  TerminalUtils.verbose(
    `Package build order: \n\t- ${R.values(cache)
      .map(R.prop('name'))
      .join(`${EOL}\t- `)}`,
  )

  return cache
}
