# Constellate Roadmap / Todo

node-version
dotenv
consider using start script?
review deps - tree-kill, pretty-error

 - [ ] BUILD - Chokidar events should result in the absolute minimal amount of work being done. e.g. transpile a single file. remove a dir, etc
 - [ ] BUILD - Build process for Node bundles should have a secondary process that copies across non-JS files.
 - [X] CHORE - Move constellate configuration into `constellate.js` files.
 - [ ] COMMAND - Create project command
 - [ ] CONFIG - Make the node version configurable.
 - [ ] CONFIG - Make the Babel-ification process optional. In which case a symlink could be created from dist/index.js to modules/index.js.  Just don't use any syntax that requires Babel in your code.
 - [ ] DEVELOP - Dependency based reloads.
 - [ ] DEVELOP - Manual reload override.
 - [ ] DEVELOP - CONFIG - Allow for explicit dependency rebuild ignore.
 - [X] FEATURE - webpack-dev-server integration for `webapp` types.
 - [ ] FEATURE - Command hooks
   - [ ] prebuild
   - [ ] postbuild
   - [ ] predevelop
   - [ ] postdevelop
   - [ ] prestart
   - [ ] poststart
 - [ ] FEATURE - Plugin architecture
 - [ ] TEMPLATE - Application template
 - [ ] TEMPLATE - Empty project
 - [ ] UX - Develop command Error resilience.
   - [ ] Startup Errors
   - [ ] Compile Time Errors
   - [ ] Runtime Errors
 - [ ] UX - Add "unhandled promise" error handler to script root.
 - [ ] UX - Terminal feedback.
 - [X] UX - Source map support for transpiled bundles.
 - [X] UX - Rename webpack output to match package name so that build output is easier to interpret.
 - [ ] ...
