/* eslint-disable no-console */

module.exports = function gracefullyShutdown(shutdown, name) {
  let shuttingDown = false

  const gracefulShutdown = () => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true

    console.log(`💀 Received kill signal, attempting to shut down ${name}...`)

    shutdown()
      .then(() => {
        console.log(`✅ ${name} gracefully shut down.`)
        process.exit(0)
      })
      .catch((err) => {
        console.log(`❌ ${name} did not shut down gracefully`)
        console.error(err.message)
        process.exit(1)
      })

    setTimeout(() => {
      console.error(`❗️ Graceful shutdown period lapsed for ${name}, forcefully shutting down.`)
      process.exit()
    }, 10 * 1000)
  }

  // listen for TERM signal .e.g. kill
  ;['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, gracefulShutdown))
}
