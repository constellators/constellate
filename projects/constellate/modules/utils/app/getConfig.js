const path = require('path')

let cache

module.exports = function getConfig() {
  if (cache) {
    return cache
  }

  // eslint-disable-next-line global-require,import/no-dynamic-require
  cache = require(path.resolve(process.cwd(), './constellate.js'))

  // TODO: Some validation

  return cache
}
