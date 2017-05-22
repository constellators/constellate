const path = require('path')
const fs = require('fs-extra')

module.exports = function getAssets(projectName) {
  const target = path.resolve(
    process.cwd(),
    `./node_modules/${projectName}/dist/webpack-manifest.json`
  )
  if (!fs.existsSync(target)) {
    throw new Error(`No manifest found at ${target}`)
  }
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const manifest = require(target)
  if (!manifest[projectName]) {
    return {}
  }
  return {
    js: manifest[projectName].js,
    css: manifest[projectName].css,
  }
}
