//      

                           
                         
                           
                                                 
 

                         
               
                       
 

                      
                         
                    
                                        
 

                     
                                        
 

                          
               
                
 

                      
              
                 
 

/* eslint-disable no-console */

const chalk = require('chalk')
const inquirer = require('inquirer')

function verbose(msg        )       {
  if (process.env.DEBUG) {
    console.log(chalk.dim(msg))
  }
}

function error(msg        , err        )       {
  console.log(chalk.red.bold(msg))
  if (err != null) {
    if (typeof err.stack !== 'undefined') {
      console.log(err.stack.substr(0, err.stack.indexOf(' at ')))
      verbose(err.stack.substr(err.stack.indexOf(' at ')))
    } else {
      console.log(err.message)
    }
  }
}

function warning(msg        )       {
  console.log(chalk.yellow(msg))
}

function title(msg        )       {
  console.log(chalk.bold.magenta(msg))
}

function info(msg        )       {
  console.log(chalk.blue(msg))
}

function success(msg        )       {
  console.log(chalk.green(msg))
}

function header(msg        )       {
  console.log(chalk.bold(msg))
}

function multiSelect(message        , options                    )                            {
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

function select(message        , options               )                             {
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

function input(message        , options                = {})                             {
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

function confirm(message        )                         {
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
  multiSelect,
  select,
  input,
  confirm,
}
