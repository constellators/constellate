# Development

Below are some critical things to be aware of when developing the core Constellate packages.


## Linking

Generally the best approach to developing is to link the packages into a target implementation.

However, linking modules is tricky enterprise that can confuse NPM.

After the full link workflow (npm link, npm link foo) you may need to run bootstrap and build on Constellate.

When done developing, unlink all packages, remove all node_modules and package-lock (in Constellate packages and the implementation project root folder) and then do a full dep reinstall. Otherwise strange things happen.
