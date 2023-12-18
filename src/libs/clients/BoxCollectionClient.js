const BaseCollectionClient = require('./BaseCollectionClient')
const Box = require('../protocol/Box')
const utilsHelper = require('../../helpers/UtilsHelper')
const log4js = require('../logger/log')
const BizBox = require('../../biz/box')
const net = require('net')

/**
 * 盒子设备业务处理类
 */
module.exports = class BoxCollectionClient extends BaseCollectionClient {
  constructor(socket) {
    super()
    socket.isFirsTransfer = true
    this.socket = socket
    this.boxData = null
    this.tmpClient = net.Socket()

    this.handler()
    // this.keepalive()
  }
  setApp(app) {
    super.setApp(app)
    this.boxBiz = new BizBox(app.dbPool)
  }
  /**
   * 存活机制
   */
  keepalive() {
    if (this.socket.interval) {
      clearInterval(this.socket.interval)
    }
    // this.socket.write('pong')
    this.socket.interval = setInterval(
      (_socket) => {
        _socket.write('pong')
      },
      1000 * 30,
      this.socket
    )
  }
  /**
   * 接收到客户端数据的处理
   * @param {*} data 
   * @returns 
   */
  onData(data) {
    // this.forwardData(data)
    this.utf8Data = data.toString('utf8')
    this.hexData = data.toString('hex')
    if (this.utf8Data.indexOf('BoxMall#') === 0) {
      return this.handlerBoxMallClient()
    }
    // console.log('[设备->网关] hexData is:', this.hexData)
    this.boxData = new Box(this.hexData)
    if (!this.boxData.validatePackage()) {
      log4js.getLogger('error').error('[网关->设备] 非法设备')
      return this._cleanCollection()
    }
    this.socket.lastMessageTime = utilsHelper.getTimestamp()
    if (this.boxData.funcHex === '80') {
      // 设备登录到网关
      return this.handlerReplayDeviceLogin()
    }

    if (this.boxData.funcHex === '81') {
      // 设备发送的心跳包
      return this.handlerReplayDeviceHeartBeat()
    }

    if (this.boxData.funcHex === '82') {
      // 发送获取ICCID/IMEI指令，收到设备回复后，就需要修改设备的iccid
      return this.handlerSetDeviceIccID()
    }

    if (this.boxData.funcHex === '73') {
      log4js.getLogger('info').info('[设备->网关] 回复出货：' + this.hexData)
      if (this.boxBiz && this.boxData.order) {
        this.boxBiz.updateOrder(this.boxData.order, 1)
      }
      return
    }
  }
  
  /**
   * 当应用程序端（类似:box.php处理)处理
   */
  handlerBoxMallClient() {
    // https://www.workerman.net/doc/gateway-worker/is-online.html
    // console.log('[应用客户端->网关] utf8Data is:', this.utf8Data)
    // 应用端连接
    if (this.utf8Data === 'BoxMall#Ping') {
      this.socket.write('Box#Pong')
      return true
    }
    const data = this.utf8Data.split('#')
    if (data.length !== 4) {
      log4js.getLogger('error').error('[网关->应用客户端] 参数错误')
      this.socket.write('Box#Err')
      return false
    }
    const code = data[1]
    if (!this.app.boxSockets.hasOwnProperty(code)) {
      log4js.getLogger('error').error('[网关->应用客户端] 设备码错误:' + code)
      this.socket.write('Box#Err')
      return false
    }
    const cmd = data[3]
    const boxData = new Box(cmd.replace(/[\s]*/gi, ''))
    // console.log('boxData:', boxData)
    if (!boxData.validatePackage()) {
      log4js.getLogger('error').error('[网关->应用客户端] 解析错误')
      this.socket.write('Box#Err')
      return false
    }
    const boxSocket = this.app.boxSockets[code]
    console.log('boxSocket:', boxSocket.deviceId, boxSocket.uniqid)
    if (data[2] === 'ICCID') {
      log4js.getLogger('info').info('[网关->设备] 获取ICCID/IMEI：' + cmd)
      return utilsHelper.sendHexCmd(boxSocket, cmd, true)
    }
    if (data[2] === 'PULL') {
      log4js.getLogger('info').info('[网关->设备] 出货：' + cmd)
      return utilsHelper.sendHexCmd(boxSocket, cmd, true)
    }
    if (data[2] === 'OPENSTATUS') {
      log4js.getLogger('info').info('[网关->设备] 常开/常闭：' + cmd)
      return utilsHelper.sendHexCmd(boxSocket, cmd, true)
    }
    if (data[2] === 'TEST') {
      log4js.getLogger('info').info('[网关->设备] 测试货道：' + cmd)
      return utilsHelper.sendHexCmd(boxSocket, cmd, true)
    }
  }

  handlerReplayDeviceLogin() {
    // 网关回复设备登录
    const cmd = this.boxData.makeReplayDeviceLoginCmd()
    utilsHelper.sendHexCmd(this.socket, cmd, true)
    if (this.boxData.crcStatus === '01') {
      if (this.socket.deviceId !== this.boxData.id) {
        this.socket.deviceId = this.boxData.id
        this.app.event.emit('box:login', this.socket)
      }
    } else {
      log4js.getLogger('error').error('[网关->设备] 校验失败，设备登录失败')
      this._cleanCollection()
    }
  }
  handlerReplayDeviceHeartBeat() {
    // 网关回复设备心跳
    const cmd = this.boxData.makeReplayHeartBeatCmd()
    // logger.info('[网关->设备] 回复设备心跳：' + cmd)
    utilsHelper.sendHexCmd(this.socket, cmd, true)
    let isOnline = 1
    if (this.boxData.signal < 20) {
      isOnline = 3
    }
    if (this.boxBiz) {
      this.boxBiz.updateMachine(this.socket.deviceId, this.socket.uniqid, isOnline)
    }
    setTimeout(() => {
      utilsHelper.sendHexCmd(this.socket, this.boxData.makeGetICCIDCmd(), true)
    }, 1000 * 3)
  }
  handlerSetDeviceIccID() {
    
  }
  _cleanCollection() {
    if (this.boxBiz) {
      this.boxBiz.updateMachine(this.socket.deviceId, this.socket.uniqid, 2)
    }
    
    super._cleanCollection()
    this.boxBiz = null
  }


  /**
   * 检测转发
   * @param {*} data 
   */
  forwardData(data) {
    if (!this.tmpClient.connected) {
      const client = this.tmpClient
      client.connect(10841, '192.168.32.23', function () {
        client.connected = true
        // console.log("连接到正式服务器")
        client.write(data)
      })
    } else {
      this.tmpClient.write(data)
    }

    this.tmpClient.on("data", function (data) {})

    this.tmpClient.on("end", () => {
      this.tmpClient.connected = false
    })
    this.tmpClient.on("close", () => {
      this.tmpClient.connected = false
    })
    this.tmpClient.on("error", () => {
      this.tmpClient.connected = false
    })
  }
}
