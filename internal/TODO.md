# Constellate Roadmap / Todo

## Bugs

 - [ ] Show consecutive build errors as may contain new info.
 - [ ] constellate-utils publishing one version behind?
 - [ ] nodeVersion needs to allow partials i.e. 4 instead of 4.x.x
 - [X] update pwns modules - we may need to unlink existing prior to running update
 - [X] Hot module reload inject code
 - [X] Develop process CMD + C doesn't seem to execute the "stop" for each process
 - [X] Dependency chain publishing not working. e.g. update and publish constellate-dev-utils
 - [X] Need to rework the versioning/publishing process. We will have to update the source package.json files directly in order to ensure correct publishing chain reactions.
 - [X] When a project is published, all their dependants need to be published too.
 - [X] Develop fails when having not previously built the projects and your are building a web client that depends on another constellate project. Mouthful.

## Chores

 - [X] replace cross-spawn with execa
 - [X] move constellate-utils into it's own repo
 - [X] Change this constellate repo back over to node 8 and update eslint config accordingly.
 - [X] Move constellate configuration into `constellate.js` files.
 - [X] refactor utils from constellate -> constellate-dev-utils

## Commands

 - [ ] Create project
 - [ ] Deploy
 - [X] Install
 - [X] Update
 - [X] Clean
 - [X] Build
 - [X] Develop
 - [X] Publish

## Develop

 - [ ] Manual reload override.
 - [ ] CONFIG - Allow for explicit dependency rebuild ignore.
 - [X] Dependency based reloads.

## Docs

 - [ ] Intro
 - [ ] Video overview
 - [ ] Blog post
 - [ ] constellate.js
 - [ ] Develop tips and tricks
 - [ ] SIGTERM/SIGINT effective usage
 - [ ] Usage of process.stdin.read() to stop process exiting (even though it has child processes)


## Features

 - [ ] Update to Webpack v3
 - [ ] Plugin extension API
 - [ ] Validate the constellate configuration (tcomb?)
 - [ ] Copy some base files across always - .npmignore, /README(.md)?/i
 - [ ] Copy across non-JS files when compiling
 - [ ] Allow for additional files to be specified in package.json files
 - [ ] Support NPM tags.
 - [ ] Make the target browserlist configurable.
 - [ ] BrowserList configuration (touch point in babel and webpack config)
 - [ ] Chokidar events should result in the absolute minimal amount of work being done. e.g. transpile a single file. remove a dir, etc
 - [ ] auto-add source-map-support to build dependencies, and then re-enable for production builds.
 - [ ] plugin interface for compilers - pre/post compile
 - [ ] plugin interface for compilers - pre/post develop
 - [ ] Command hooks
   - [ ] prebuild
   - [ ] postbuild
   - [ ] predevelop
   - [ ] postdevelop
   - [ ] prestart
   - [ ] poststart
 - [X] add script compiler plugin
 - [X] need a devDependencies and softDependencies
 - [X] allow a "script" compiler type, with compilerOptions allowing you to target a script
 - [X] Use config.releaseBranch to control the branch that is used for release generation (defaults to master)
 - [X] Support a 'none' compiler. This is complicated as the NPM publishing process falls over if you symlink a folder. Therefore file copy/paste is the only easy way thusfar.
 - [X] plugin interface for compilers - pre/post publish
 - [X] Plugin architecture for compilers
 - [X] refactor everything into plugins!!
 - [X] develop servers resolved from plugins should resolve into an known API, e.g. { kill: () => Promise }
 - [X] When publish show the projects to publish and ask to confirm?
 - [X] Check if remote has changes to pull
 - [X] Make the target node version configurable.
 - [X] Check if remote exists
 - [X] webpack-dev-server integration for `webapp` types.
 - [X] Webpack plugin(s) - Use https://github.com/Urthen/case-sensitive-paths-webpack-plugin

## Templates

 - [ ] Application template
 - [ ] Empty project


## Test

 - [ ] Polyfill compilation to the following targets
    - [ ] Node
    - [ ] Browser
       - [ ] Chrome
       - [ ] IE 9
       - [ ] Safari

## UX

 - [ ] Publish command Error resilience.
 - [ ] Terminal "centerer" https://stackoverflow.com/questions/30335637/get-width-of-terminal-in-node-js
 - [ ] use why-is-node-running for helpful errors?
 - [X] Develop command Error resilience.
   - [X] Startup Errors
   - [X] Compile Time Errors
   - [X] Runtime Errors
 - [X] Add "unhandled promise" error handler to script root.
 - [X] Terminal feedback.
 - [X] Source map support for transpiled bundles.
 - [X] Rename webpack output to match package name so that build output is easier to interpret.
 - [X] Ensure proper webpack error handling https://webpack.js.org/api/node/#error-handling