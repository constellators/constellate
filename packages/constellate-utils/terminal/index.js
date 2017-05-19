const chalk = require('chalk')
const figures = require('figures')
const ora = require('ora')

function error(msg, err) {
  console.log(chalk.bgRed.black.bold(`${figures.warning} ${msg}`))
  if (err) {
    console.log(err)
    console.log('\n')
  }
}

function warning(msg) {
  console.log(`${chalk.yellow(figures.warning)} ${chalk.yellow(msg)}`)
}

function info(msg) {
  console.log(`${chalk.blue(figures.info)} ${chalk.blue(msg)}`)
}

function success(msg) {
  console.log(`${chalk.green(figures.tick)} ${chalk.green(msg)}`)
}

function verbose(msg) {
  if (process.env.DEBUG) {
    console.log(msg)
  }
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
  statusMode = false,
}) {
  let status
  if (statusMode) {
    status = ora({ text, color: 'blue', spinner }).start()
  } else {
    console.log(chalk.blue(text))
  }
  return work()
    .then(() => {
      if (statusMode) {
        status.stopAndPersist({ text: successText || text, symbol: successSymbol })
      } else {
        console.log(`${successSymbol} ${chalk.green(successText)}`)
      }
    })
    .catch((err) => {
      if (statusMode) {
        status.stopAndPersist({ text: errorText || text, symbol: errorSymbol })
      } else {
        console.log(`${errorSymbol} ${chalk.red(errorText)}`)
      }
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
  success,
  verbose,
  unitOfWork,
}
