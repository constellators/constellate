const deepMerge = require('deepmerge')

const defaultConfig = {
  timeout: 10 * 1000,
  messages: {
    start: 'Received termination request. Attempting gracefully exit...',
    error: 'An error occurred whilst attempting to gracefully exit.',
    timeout: 'Graceful shutdown period timeout lapsed, forcefully shutting down.',
  },
  catchUnhandled: true,
}

module.exports = function configureGracefulExit(config = {}) {
  const { onExit, messages, timeout, name, catchUnhandled } = deepMerge(defaultConfig, config)

  if (typeof onExit !== 'function') {
    console.error('You must provide an onExit "function" to configureGracefulExit')
  }

  const frmtMsg = msg => `[${name || process.pid}] ${msg}`

  let exiting = false

  const handleExit = (exitCode) => {
    if (exiting) {
      return
    }
    exiting = true
    try {
      Promise.resolve(onExit).then(() => process.exit(exitCode)).catch((err) => {
        console.error(frmtMsg(messages.error))
        console.error(err)
        process.exit(1)
      })

      setTimeout(() => {
        console.error(frmtMsg(messages.timeout))
        process.exit(1)
      }, timeout)
    } catch (err) {
      console.error(frmtMsg(messages.error))
      console.error(err)
    }
  }

  // Respond to any termination requests
  ;['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => handleExit(0))
  })

  // Catch any unhandled promise rejections
  if (catchUnhandled) {
    process.on('unhandledRejection', (err) => {
      console.error('An unhandled rejection occurred', err)
      handleExit(1)
    })
  }
}
