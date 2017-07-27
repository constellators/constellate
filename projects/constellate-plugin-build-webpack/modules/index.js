const bundle = require('./bundle')

// :: Project, Options -> DevelopAPI
module.exports = function webpackBuildPlugin(project, options) {
  return {
    build: () => bundle(project),
  }
}
