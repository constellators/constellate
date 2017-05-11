const path = require('path')
const fs = require('fs-extra')
const webpack = require('webpack')

const generateConfig = require('./generateConfig')

// :: Options -> Promise<void>
module.exports = function bundle(options) {
  return new Promise((resolve, reject) => {
    const { project } = options

    const config = generateConfig({ project })
    const compiler = webpack(config)
    compiler.run((err, stats) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
