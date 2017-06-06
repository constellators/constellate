/* eslint-disable no-console */

const chalk = require('chalk')
const figures = require('figures')
const inquirer = require('inquirer')

function verbose(msg) {
  if (process.env.DEBUG) {
    console.log(msg)
  }
}

function error(msg, err) {
  console.log(chalk.red.bold(`\n${figures.warning} ${msg}`))
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
  console.log(chalk.yellow(`\n${figures.warning} ${msg}`))
}

function title(msg) {
  console.log(chalk.blue(`\n${figures.play} ${msg}`))
}

function info(msg) {
  console.log(chalk.blue(`\n${figures.info} ${msg}`))
}

function success(msg) {
  console.log(chalk.green(`\n${figures.tick} ${msg}`))
}

function header(msg) {
  console.log(chalk.underline(`\n${msg}`))
}

function select(message, { choices, filter, validate } = {}) {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'prompt',
        message,
        choices,
        pageSize: choices.length,
        filter,
        validate,
      },
    ])
    .then(answers => answers.prompt)
}

function input(message, { filter, validate } = {}) {
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'input',
        message,
        filter,
        validate,
      },
    ])
    .then(answers => answers.input)
}

function confirm(message) {
  return inquirer
    .prompt([
      {
        type: 'expand',
        name: 'confirm',
        message,
        default: 2, // default to help in order to avoid clicking straight through
        choices: [{ key: 'y', name: 'Yes', value: true }, { key: 'n', name: 'No', value: false }],
      },
    ])
    .then(answers => answers.confirm)
}

module.exports = {
  header,
  title,
  error,
  warning,
  info,
  success,
  verbose,
  select,
  input,
  confirm,
}
