const { EOL } = require('os')
const template = require('babel-template')

// We wrap our code with a check for the webpack inject env var to ensure that
// we don't initialise source maps twice.
const sourceMapImportAST = template(`
  if (!process.env.CONSTELLATE_IS_WEBPACK) {
    try {
      var sourceMapSupport = require('source-map-support');
      sourceMapSupport.install({
        environment: 'node'
      });
    } catch(err) {
      console.log('In order to provide a better debugging experience of your Constellate projects please ensure that source-map-support is installed.${EOL}${EOL}\tnpm i source-map-support -S -E');
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
