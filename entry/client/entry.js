// import client methods for optimisic loading
import '../../methods/client';

// Seed and initialize react components
import './root';

// set scope for google auth to include drive access
var scopes = ['https://www.googleapis.com/auth/drive'];

// use ctrl+m to view these collections on the client
if (process.env.NODE_ENV !== 'production'){
  Package['meteortoys:toykit'].MeteorToysDict.set('Mongol', 
    {collections: ['users', 'codes', 'decks', 'posts', 'shows', 'audience'] })
}

Accounts.ui.config({
  'passwordSignupFields': 'USERNAME_ONLY',
  'requestPermissions': { 'google': scopes },
  // TODO: figure out how to actually make tokens refreshify
  'requestOfflineToken': { 'google': true }
});

if (process.env.NODE_ENV !== 'production') {
  if (process.env.FRAMEWORK === 'jasmine-client-integration') {
    // Run the integration tests on the mirror
    const context = require.context('../../modules', true, /\/client\/(.*)\/integration\/(.*)\-test\.jsx?$/);
    context.keys().forEach(context);
  } else {
    // Run unit tests on client
    const context = require.context('../../modules', true, /\/client\/(.*)\/unit\/(.*)\-test\.jsx?$/);
    context.keys().forEach(context);
  }
}
