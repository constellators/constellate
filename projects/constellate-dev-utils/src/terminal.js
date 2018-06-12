// @flow

type MultiSelectOptions = {
  choices: Array<string>,
  selected?: Array<string>,
  validate?: (Array<string>) => boolean | string,
}

type MultiValueAnswer = {
  type: string,
  value: Array<string>,
}

type SelectOptions = {
  choices: Array<string>,
  selected?: string,
  validate?: string => boolean | string,
}

type InputOptions = {
  validate?: string => boolean | string,
}

type SingleValueAnswer = {
  type: string,
  value: string,
}

type ConfirmAnswer = {
  key: string,
  value: boolean,
}

/* eslint-disable no-console */

const chalk = require('chalk')
const inquirer = require('inquirer')

function verbose(msg: string): void {
  if (process.env.DEBUG) {
    console.log(chalk.dim(msg))
  }
}

function error(msg: string, err?: Error): void {
  console.log(chalk.red.bold(msg))
  console.log(err || new Error(msg))
}

function warning(msg: string): void {
  console.log(chalk.yellow(msg))
}

function title(msg: string): void {
  console.log(chalk.bold.magenta(msg))
}

function info(msg: string): void {
  console.log(chalk.blue(msg))
}

function success(msg: string): void {
  console.log(chalk.green(msg))
}

function header(msg: string): void {
  console.log(chalk.bold(msg))
}

function multiSelect(
  message: string,
  options: MultiSelectOptions,
): Promise<MultiValueAnswer> {
  const { choices, selected, validate } = options
  return inquirer
    .prompt([
      {
        type: 'checkbox',
        name: 'prompt',
        message,
        choices,
        pageSize: choices.length,
        validate,
        default: selected,
      },
    ])
    .then(answers => answers.prompt)
}

function select(
  message: string,
  options: SelectOptions,
): Promise<SingleValueAnswer> {
  const { choices, validate } = options
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'prompt',
        message,
        choices,
        pageSize: choices.length,
        validate,
      },
    ])
    .then(answers => answers.prompt)
}

function input(
  message: string,
  options?: InputOptions = {},
): Promise<SingleValueAnswer> {
  const { validate } = options
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'input',
        message,
        validate,
      },
    ])
    .then(answers => answers.input)
}

function confirm(message: string): Promise<ConfirmAnswer> {
  return inquirer
    .prompt([
      {
        type: 'expand',
        name: 'confirm',
        message,
        default: 2, // default to help in order to avoid clicking straight through
        choices: [
          { key: 'y', name: 'Yes', value: true },
          { key: 'n', name: 'No', value: false },
        ],
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
  multiSelect,
  select,
  input,
  confirm,
}
