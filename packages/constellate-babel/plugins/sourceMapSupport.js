const template = require('babel-template')

const sourceMapImportAST = template(`
  if (!process.env.CONSTELLATE_IS_WEBPACK) {
    try {
      var sourceMapSupport = require('source-map-support');
      sourceMapSupport.install({
        environment: 'node'
      });
    } catch(err) {
      console.error('In order to provide a better debugging experience of your Constellate projects please ensure that source-map-support is installed.\\n\\nnpm i source-map-support -S -E');
    }
  }
`)()

module.exports = function sourceMapSupportPlugin() {
  return {
    visitor: {
      Program: {
        exit(path) {
          path.unshiftContainer('body', sourceMapImportAST)
        },
      },
    },
  }
}
