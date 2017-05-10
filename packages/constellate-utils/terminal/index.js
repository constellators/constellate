const chalk = require('chalk')
const figures = require('figures')
const ora = require('ora')

function error(msg) {
  console.log(chalk.red(msg))
}

function warning(msg) {
  console.log(chalk.yellow(msg))
}

function info(msg) {
  console.log(chalk.blue(msg))
}

/**
 * Performs a given unit of work, outputting a status text to indicate it's
 * progress.
 *
 * @param  {Function} work
 *         The work to execute. The function should return a Promise.
 * @param  {string} text
 *         The status text describing the work.
 * @param  {string} [spinner]=dots
 *         The spinner to use.
 * @param  {string} [successSymbol]
 *         The symbol to display on successful completion of the work.
 * @param  {string} [successText]
 *         The text to display on successful completion of the work.
 * @param  {string} [errorSymbol]
 *         The symbol to display on failure to complete the work.
 * @param  {string} [errorText]
 *         The text to display on failure to complete the work.
 * @param  {bool} [logError]=false
 *         If an error occurs then log it to the console.
 * @param  {bool} [exitOnError]=false
 *         If an error occures then exit the process.
 *
 * @return {Promise} A promise representing the UoW.
 */
function unitOfWork({
  work,
  text,
  spinner = chalk.yellow('dots'),
  successSymbol = chalk.green(figures.tick),
  successText,
  errorSymbol = chalk.red(figures.cross),
  errorText,
  logError = false,
  exitOnError = false,
}) {
  const status = ora({ text, color: 'blue', spinner }).start()
  return work()
    .then(() => {
      status.stopAndPersist({ text: successText || text, symbol: successSymbol })
    })
    .catch((err) => {
      status.stopAndPersist({ text: errorText || text, symbol: errorSymbol })
      if (err && logError) {
        if (err.stack) {
          console.log(err.stack)
        } else {
          console.log(err)
        }
      }
      if (exitOnError) {
        process.exit(2)
      }
      throw err
    })
}

module.exports = {
  error,
  warning,
  info,
  unitOfWork,
}
