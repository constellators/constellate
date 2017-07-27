const bundle = require('./bundle')

// :: Project, Options -> DevelopAPI
module.exports = function webpackNodeBuildPlugin(project, options) {
  return {
    build: () => bundle(project),
  }
}
