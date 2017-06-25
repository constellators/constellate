Linking modules is tricky.
After the full link workflow (npm link, npm link foo) you need to run bootstrap and build
When done, unlink all, remove all node_modules and package-lock and do a full dep reinstall. Otherwise strange things happen. You may have to manually remove the package-lock.json files as when they have been linked the npm run clean cmd doesn't seem to kill them.
