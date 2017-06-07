const bundle = require('./bundle')
const startDevServer = require('./startDevServer')

module.exports = {
  compile: bundle,
  develop: startDevServer,
  prePublish: () => undefined,
  postPublish: () => undefined,
}
