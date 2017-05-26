const chalk = require('chalk')
const figures = require('figures')

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

module.exports = {
  error,
  warning,
  info,
  success,
  verbose,
}
