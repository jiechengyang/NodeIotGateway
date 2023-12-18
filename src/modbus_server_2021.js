const UtilsHelper = require('./helpers/UtilsHelper'),
    systemConfig = UtilsHelper.loadConfig(),
    CollectionServer = require('./libs/collectionServer')

let collectionSerer = new CollectionServer(systemConfig)

collectionSerer.run('modbus')