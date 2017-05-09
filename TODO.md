# Constellate Roadmap / Todo

 - [X] Move constellate configuration into `constellate.js` files.
 - [ ] Chokidar events should result in the absolute minimal amount of work being done. e.g. transpile a single file. remove a dir, etc
 - [ ] Build process for Node bundles should have a secondary process that copies across non-JS files.
 - [ ] Make the Babel-ification process optional. In which case a symlink could be created from dist/index.js to modules/index.js.  Just don't use any syntax that requires Babel in your code.
 - [ ] Error handling.
 - [ ] Terminal feedback.
 - [X] webpack-dev-server integration for `webapp` types.
 - [ ] Make the node version configurable.
 - [X] Source map support for transpiled bundles.
 - [ ] Rename webpack output to match package name so that build output is easier to interpret.
 - [ ] ...
