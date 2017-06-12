const transpile = require('./transpile')

// :: Project, Options -> DevelopAPI
module.exports = function babelCompiler(project, options) {
  return {
    compile: transpile,
  }
}
