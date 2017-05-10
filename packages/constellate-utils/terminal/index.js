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

const unitOfWork = ({
  work,
  text,
  successSymbol = chalk.green(figures.tick),
  errorSymbol = chalk.red(figures.cross),
  exitOnError = true,
}) => {
  const status = ora({ text, color: 'blue' }).start()
  work()
    .then(() => {
      status.stopAndPersist({ text, symbol: successSymbol })
    })
    .catch((err) => {
      status.stopAndPersist({ text, symbol: errorSymbol })
      error(err)
      if (exitOnError) {
        process.exit(2)
      }
    })
}

module.exports = {
  error,
  warning,
  info,
  unitOfWork,
}
