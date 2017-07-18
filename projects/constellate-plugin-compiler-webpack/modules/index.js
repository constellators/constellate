const bundle = require('./bundle')

// :: Project, Options -> DevelopAPI
module.exports = function webpackCompiler(project, options) {
  return {
    compile: () => bundle(project),
  }
}
