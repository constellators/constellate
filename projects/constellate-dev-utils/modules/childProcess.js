//      

                                                 

const execa = require('execa')
const TerminalUtils = require('./terminal')

function exec(command        , args                 = [], opts          = {})                  {
  TerminalUtils.verbose(
    `exec child process: ${command} ${args.join(' ')}${opts.cwd ? ` (${opts.cwd})` : ''}`,
  )

  return execa(
    command,
    args,
    Object.assign(
      {},
      {
        env: process.env,
        stdio: 'pipe',
      },
      opts,
    ),
  ).then(result => result.stdout)
}

function execSync(command        , args                 = [], opts          = {})         {
  TerminalUtils.verbose(
    `execSync child process: ${command} ${args.join(' ')}${opts.cwd ? ` (${opts.cwd})` : ''}`,
  )

  return execa.sync(
    command,
    args,
    Object.assign(
      {},
      {
        env: process.env,
      },
      opts,
    ),
  ).stdout
}

function spawn(
  command        ,
  args                 = [],
  opts          = {},
)                        {
  TerminalUtils.verbose(
    `spawn child process: ${command} ${args.join(' ')}${opts.cwd ? ` (${opts.cwd})` : ''}`,
  )

  return execa(
    command,
    args,
    Object.assign(
      {},
      {
        env: process.env,
        stdio: 'inherit',
      },
      opts,
    ),
  )
}

module.exports = {
  exec,
  execSync,
  spawn,
}
