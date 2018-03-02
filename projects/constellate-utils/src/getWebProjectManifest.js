/* eslint-disable camelcase */

const path = require('path')
const fs = require('fs-extra')

const requireFn =
  typeof __non_webpack_require__ !== 'undefined'
    ? // eslint-disable-next-line no-undef
      __non_webpack_require__
    : require

const cache = {}

/**
 * Gets the manifest for the constellate web project by the given name.
 *
 * @param  {string} projectName The project's name
 * @return {Object}             The manifest
 */
module.exports = function getWebProjectManifest(
  projectName,
  basePath = './dist',
) {
  if (cache[projectName]) {
    return cache[projectName]
  }
  const packagePath = require.resolve(projectName)
  const distPath = path.resolve(process.cwd(), `${packagePath}/${basePath}`)
  const manifestFile = path.resolve(distPath, './webpack-manifest.json')
  if (!fs.existsSync(manifestFile)) {
    throw new Error(`No manifest found at ${manifestFile}`)
  }
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const manifest = requireFn(manifestFile)
  if (!manifest.index) {
    throw new Error(
      `Invalid constellate web project manifest found at ${manifestFile}`,
    )
  }

  const jsParts = manifest.index.js
    .substr(manifest.index.js.indexOf('/constellate/'))
    .split('/')
  const rootHttpPath = jsParts.slice(0, jsParts.length - 1).join('/')

  cache[projectName] = {
    serverPaths: {
      root: distPath,
    },
    httpPaths: {
      root: rootHttpPath,
      js: manifest.index.js,
      css: manifest.index.css,
    },
    manifest,
  }

  return cache[projectName]
}
