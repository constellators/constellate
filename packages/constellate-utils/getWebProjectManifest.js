/* eslint-disable camelcase */

const path = require('path')
const fs = require('fs-extra')

const requireFn = typeof __non_webpack_require__ !== 'undefined'
  ? // eslint-disable-next-line no-undef
    __non_webpack_require__
  : require

/**
 * Gets the manifest for the constellate web project by the given name.
 *
 * @param  {string} projectName The project's name
 * @return {Object}             The manifest
 */
module.exports = function getWebProjectManifest(projectName) {
  const target = path.resolve(
    process.cwd(),
    `./node_modules/${projectName}/modules/webpack-manifest.json`
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
    main: {
      js: manifest[projectName].js,
      css: manifest[projectName].css,
    },
    manifest,
  }
}
