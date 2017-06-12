const path = require('path')
const fs = require('fs-extra')

function resolvePackage(resolvedPackageName) {
  const packagePath = path.resolve(process.cwd(), `./node_modules/${resolvedPackageName}`)

  let resolvedPackage
  try {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    resolvedPackage = require(packagePath)
  } catch (err) {
    // EEK! Could be a symlink?
    try {
      fs.lstatSync(packagePath)
      const symLinkPath = fs.readlinkSync(path)
      // eslint-disable-next-line global-require,import/no-dynamic-require
      resolvedPackage = require(symLinkPath)
    } catch (symErr) {
      // DO nothing
    }
  }

  return resolvedPackage
}

module.exports = {
  resolvePackage,
}
