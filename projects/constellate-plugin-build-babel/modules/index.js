const transpile = require('./transpile')

// :: Project, Options -> DevelopAPI
module.exports = function babelBuildPlugin(project, options) {
  return {
    build: () => transpile(project),
  }
}
