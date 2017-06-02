const path = require('path')

module.exports = function getConfig() {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  return require(path.resolve(process.cwd(), './constellate.js'))
}
