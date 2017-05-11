const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const generateConfig = require('./generateConfig')

// :: Options -> Server
module.exports = function startDevServer(options) {
  const { project } = options

  const config = generateConfig({ project })
  const compiler = webpack(config, (err, stats) => {
    if (err) {
      console.error('Fatal error attempting to bundle', project.name)
      console.error(err)
    }
    if (stats.hasErrors()) {
      console.error(stats.toString({ colors: true, chunks: false }))
    }
  })
  const server = new WebpackDevServer(compiler, {
    publicPath: config.output.publicPath,
    stats: 'minimal',
  })

  // TODO: Configurable port
  server.listen(8080, '127.0.0.1', () => {
    console.log('Starting server on http://localhost:8080')
  })

  return server
}
