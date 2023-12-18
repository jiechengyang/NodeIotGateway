const net = require('net'),
  DbProxy = require('./DbProxy'),
  StringHelper = require('../helpers/StringHelper'),
  BoxCollectionClient = require('./clients/BoxCollectionClient'),
  BaseCollectionClient = require('./clients/BaseCollectionClient')
  log4js = require('./logger/log'),
  logger = log4js.getLogger('default'),
  EventEmitter = require('events').EventEmitter,
  heartBeat = require('./HeartBeat')

  // 客户端映射
  const MODE_HANDLERS = {
    box: BoxCollectionClient, // 在 'box' 模式下使用 BoxCollectionClient 类处理
    // 可以添加其他模式和对应的处理程序类
  }
module.exports = class CollectionServer {
  constructor(config) {
    this.config = config
    this.client = null
    this.event = new EventEmitter()
    this.collectSocketCount = 0
    //  所有设备连接-可以存到redis
    this.boxSockets = []
    // 所有客户端连接
    this.collectSockets = []
  }

  /**
   * 初始化
   */
  init() {
    // this.initDb()
    this.initServer()

    // 客户端断开连接
    this.event.on('close:client', (socket) => {
      this.collectSocketCount -= 1
      if (this.boxSockets.hasOwnProperty(socket.deviceId)) {
        delete this.boxSockets[socket.deviceId]
      }
      if (this.collectSockets.hasOwnProperty(socket.uniqid)) {
        delete this.collectSockets[socket.uniqid]
      }
    })

    // box 设备登录
    this.event.on('box:login', socket => {
      // this.boxSockets[socket.deviceId] = socket
      this.boxSockets[socket.uniqid] = socket
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.log('未处理的拒绝：', promise, '原因：', reason)
      logger.error('[服务端] 未处理的拒绝')
      // 记录日志、抛出错误、或其他逻辑。
    })

    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT']
    signals.forEach(signal => process.on(signal, () => {
        logger.info('[服务端] 停止服务')
        // https://www.jianshu.com/p/e73b4b077c68
        this.clear()
        setTimeout(() => {
          process.exit(0)
        }, 500)
      }))
    // process.on('SIGINT', () => {
    //   logger.info('[服务端] 停止服务')
    //   this.clear()
    //   process.exit(0)
    // })
  }


  initDb() {
    //定义pool池
    this.dbPool = new DbProxy(this.config.mysql, true)
  }

  async disconnectDb() {
    if (this.dbPool) {
      await this.dbPool.end()
    }
  }

  /**
   * 初始tcp服务
   */
  initServer() {
    let that = this
    this.server = net.createServer((socket) => {
      const CollectionClientClass = MODE_HANDLERS[this.mode] || BaseCollectionClient
      const collectionClient = new CollectionClientClass(socket)
      collectionClient.setApp(this)
      this.client = collectionClient
    })
    this.handler()
  }

  run(mode = 'box') {
    this.mode = mode.toLocaleLowerCase()
    this.init()
    this.server.listen(
      {
        host: this.config.host,
        port: this.config.port,
      },
      () => {
        const address = this.server.address()
        /* 说明TCP服务器监听的地址是 IPv6 还是 IPv4 */
        logger.info('[服务端] the family of server is ' + address.family)
      }
    )
  }

  /**
   * 基础事件
   */
  handler() {
    this.server.on('connection', this.onConnection.bind(this))
    this.server.on('listening', this.onListening.bind(this))
    this.server.on('close', this.onClose.bind(this))
    this.server.on('error', this.onError.bind(this))
  }

  onConnection(socket) {
    logger.log(
      '[客户端] The Client From: ' + socket.remoteAddress + ':' + socket.remotePort
    )
    // const uniqid = UtilsHelper.saltHashStr(
    //   socket.remoteAddress + ':' + socket.remotePort
    // )
    socket.isCheckHeart = true
    this.collectSocketCount += 1
    const uniqid = StringHelper.stringToHex(socket.remoteAddress + ':' + socket.remotePort + ':' + this.collectSocketCount)
    socket.uniqid = uniqid
    this.collectSockets[socket.uniqid] = socket
    logger.info(`[服务端] 当前客户端连接数：${this.collectSocketCount}`)
  }

  onListening() {
    const msg = '启动 采数 服务， tcp://' + this.config.host + ':' + this.config.port
    logger.info('[服务端] ' + msg)
    console.log('this.config.heartTime:', this.config.heartTime)
    heartBeat.detectionLater(this.collectSockets, this.config.heartTime)
  }

  onClose() {
    this.clear()
    logger.info('[服务端] server closed!')
  }

  onError(err) {
    this.clear()
    let that = this
    const msg = `error#code${err.code}#info#${err.toString()}`
    logger.error(`[服务端] ${msg}`)
    if ('EADDRINUSE' === err.code) {
      logger.error('[服务端] 地址正被使用，重试中...')
      setTimeout(() => {
        that.server.close()
        that.server.listen(this.config.host, this.config.port)
      }, 1000)
    }
  }
  clear(disconnectDb = true) {
    this._offLineBoxs()
    // this._clearSocketInterval()
    heartBeat.clearInterval()
    this.collectSocketCount = 0
    this.boxSockets = []
    this.collectSockets = []
    this.event = null
    this.client = null
    if (disconnectDb) {
      this.disconnectDb()
    }
  }
  async _offLineBoxs() {
    if (this.client && this.client.boxBiz) {
      for (let key in this.boxSockets) {
        let socket = this.boxSockets[key]
        if (socket.hasOwnProperty('deviceId') && socket.deviceId) {
          await this.client.boxBiz.updateMachineWithCloseServer(this.config.mysql, socket.deviceId, socket.uniqid)
        }
      }
    }
  }
  _clearSocketInterval() {
    for (let key in this.boxSockets) {
      let socket = this.boxSockets[key]
      if (socket.interval) {
        clearInterval(socket.interval)
      }
    }
  }
}
