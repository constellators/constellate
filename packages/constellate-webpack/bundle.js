const webpack = require('webpack')
const execSync = require('child_process').execSync
const pathResolve = require('path').resolve

const generateConfig = require('./generateConfig')

module.exports = function bundle(options) {
  const { optimize, packageConfig } = options
  const { paths } = packageConfig

  // First clear the build output dir.
  execSync(`$(npm bin)/rimraf ${pathResolve(paths.root, './dist')}`, {
    stdio: 'inherit',
    cwd: paths.root,
  })

  const configurations = [{ target: 'node' }, { target: 'web' }]

  configurations.forEach((config) => {
    const compiler = webpack(generateConfig(config))
    compiler.run((err, stats) => {
      if (err) {
        console.error(err)
        return
      }
      console.log(stats.toString({ colors: true }))
    })
  })
}
