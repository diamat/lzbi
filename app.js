
/**
 * Module dependencies.
 */

var app = require('express').createServer();

require('./config/config').boot_config(app);
require('./lib/helpers-static').bootStaticHelpers(app);
require('./lib/helpers-dynamic').bootDynamicHelpers(app);
require('./lib/controllers').bootControllers(app);
require('./lib/socket').bootSocket(app);

app.listen(3000);
console.log('Express app started on port 3000');