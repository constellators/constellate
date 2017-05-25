/* eslint-disable camelcase */

const path = require('path')
const fs = require('fs-extra')

const requireFn = typeof __non_webpack_require__ !== 'undefined'
  ? // eslint-disable-next-line no-undef
    __non_webpack_require__
  : require

module.exports = function getAssets(projectName) {
  const target = path.resolve(
    process.cwd(),
    `./node_modules/${projectName}/build/webpack-manifest.json`
  )
  if (!fs.existsSync(target)) {
    throw new Error(`No manifest found at ${target}`)
  }
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const manifest = requireFn(target)
  if (!manifest[projectName]) {
    return {}
  }
  return {
    js: manifest[projectName].js,
    css: manifest[projectName].css,
  }
}
