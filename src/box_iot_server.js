const UtilsHelper = require('./helpers/UtilsHelper'),
  systemConfig = UtilsHelper.loadConfig(),
  CollectionServer = require('./libs/collectionServer')

let collectionServer = new CollectionServer(systemConfig)

// 运行tcp服务
collectionServer.run()
