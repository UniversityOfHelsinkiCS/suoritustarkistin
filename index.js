require('dotenv').config({ quiet: true })
require('module-alias/register')
// Must precede ./server: the Sentry SDK instruments modules as they are loaded
require('./server/instrument')
require('./server')
