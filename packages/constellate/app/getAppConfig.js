const path = require('path')

module.exports = function getAppConfig() {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  return require(path.resolve(process.cwd(), './constellate.app.js'))
}
