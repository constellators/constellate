const chalk = require('chalk')
const figures = require('figures')

function verbose(msg) {
  if (process.env.DEBUG) {
    console.log(msg)
  }
}

function error(msg, err) {
  console.log(chalk.bgRed.white.bold(`${figures.warning} ${msg}`))
  if (err) {
    if (typeof err === 'object' && typeof err.message !== 'undefined') {
      if (typeof err.stack !== 'undefined') {
        console.log(err.stack.substr(0, err.stack.indexOf(' at ')))
        verbose(err.stack.substr(err.stack.indexOf(' at ')))
      } else {
        console.log(err.message)
      }
    } else {
      console.log(err)
    }
  }
}

function warning(msg) {
  console.log(`${chalk.yellow(figures.warning)} ${chalk.yellow(msg)}`)
}

function info(msg) {
  console.log(`${chalk.blue(figures.play)} ${chalk.blue(msg)}`)
}

function success(msg) {
  console.log(`${chalk.green(figures.tick)} ${chalk.green(msg)}`)
}

module.exports = {
  error,
  warning,
  info,
  success,
  verbose,
}
