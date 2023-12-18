let mainConfig = require('./params');
let mainLocalConfig = require('./params-local');
module.exports = Object.assign(mainConfig, mainLocalConfig);