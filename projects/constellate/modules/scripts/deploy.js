const AppUtils = require('constellate-dev-utils/modules/app')

module.exports = async function deploy() {
  console.log('Coming soon ⏰')

  console.log(AppUtils.getLastXVersionTags(5))
}

// TODO
// - Checkout target release
// - Build projects.
// - Locate each one with a deploy to now and then deploy in order.
// - Done.
