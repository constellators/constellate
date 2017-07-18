const bundle = require('./bundle')

// :: Project, Options -> DevelopAPI
module.exports = function webpackNodeCompiler(project, options) {
  return {
    compile: () => bundle(project),
  }
}
