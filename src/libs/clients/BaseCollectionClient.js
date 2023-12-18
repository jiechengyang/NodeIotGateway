const UtilsHelper = require('../../helpers/UtilsHelper')
const systemConfig = UtilsHelper.loadConfig()
const log4js = require('../logger/log')
const logger = log4js.getLogger('default')
var EventEmitter = require('events').EventEmitter
var event = new EventEmitter()
module.exports = class BaseCollectionClient {
  constructor() {
    this.hexData = null
    this.utf8Data = null
    this.socket = null
    this.settingSocket = null
    this.systemConfig = systemConfig
    this.app = null
  }
  setApp(app) {
    this.app = app
  }

  handler() {
    this.socket.on('data', this.onData.bind(this))
    this.socket.on('end', this.onEnd.bind(this))
    this.socket.on('close', this.onClose.bind(this))
    this.socket.on('error', this.onError.bind(this))
    this.socket.on('drain', this.onDrain.bind(this))
  }

  onEnd() {
    logger.info('[客户端] 接收到来自对方的FIN包之后才触发的')
  }

  onClose() {
    const conn = this.socket.remoteAddress + ':' + this.socket.remotePort
    logger.info(`[客户端] The Collection Client closed, conn=${conn}`)
    if (this.socket.hasOwnProperty('deviceId') && this.socket.deviceId) {
      logger.info(`[客户端] collection device Id=${this.socket.deviceId}`)
    }

    this._cleanCollection()
  }

  onError(err) {
    const msg = 'The socket An error occurred:' + err.message
    logger.error('[客户端] ' + msg)
    this._cleanCollection()
  }

  onDrain() {
    /**
     * @todo 输入流大于输出流的时候发生
     * @link https://blog.csdn.net/weixin_34290096/article/details/90684538
     */
    logger.info('[客户端] drain event fired.')
  }

  _cleanCollection() {
    if (this.socket.interval) {
      clearInterval(this.socket.interval)
    }
    this.socket.interval = null
    this.hexData = null
    this.utf8Data = null
    this.socket.deviceId = null
    this.socket.pause()
    this.socket.end()
    this.socket.destroy()
    try {
      if (this.app.event) {
        this.app.event.emit('close:client', this.socket)
      }
    } catch(e) {
      
    }
    this.app = null
  }

  _writeDataLog() {}

  log(msg, type = 'info') {
    msg =
      `[客户端] ----${type} start -----  \r\n` +
      msg +
      `\r\n  ----${type} end -----` +
      '\r\n\r\n'
    if ('error' === type) {
      logger.error(msg)
    } else {
      logger.info(msg)
    }
  }

  setConfig(utf8Data) {
    // TODO: 重置定时任务时间 匹配 utf8Data 是否还有 CONFIG config.frequency ENDCONFIG
    // for (let key in this.collectSockets) {
    //     let socket = this.collectSockets[key]
    //     clearInterval(socket.interval)
    //     socket.interval = setInterval((_socket, config) => {
    //         UtilsHelper.sedHexCommand(_socket, config.cmd.readData1)
    //     }, systemConfig.frequency, systemConfig)
    // }
    // TODO: 重置数据库配置 匹配 utf8Data 是否还有 CONFIG config.mysql ENDCONFIG 处理方式同上
  }
}
