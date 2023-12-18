const BaseCollectionClient = require('./BaseCollectionClient')
const SoliData = require('../protocol/other/SoliData')
const WeatherData = require('../protocol/other/WeatherData')
const CropsGrowData = require('../protocol/other/CropsGrowData')
const SettingData = require('../protocol/SettingData')
const net = require("net")
module.exports = class OtherCollectionClient extends BaseCollectionClient {
  constructor(socket) {
    super()
    socket.isFirsTransfer = true
    this.socket = socket
    this.tmpClient = net.Socket()

    this.handler()
    this.keepalive()
  }
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
  onData(data) {
    this.utf8Data = data.toString('utf8')
    console.log('raw this.utf8Data:', this.utf8Data)
    this.parseData()
  }

  parseData() {
    if (this.utf8Data.indexOf('type') === 0) {
      if (this.socket.interval) {
        clearInterval(this.socket.interval)
      }
      this.dataProtocol = new SoliData(this.utf8Data)
    } else if (this.utf8Data.indexOf('#') === 0 || this.utf8Data.indexOf('23') === 0 || this.utf8Data.indexOf('HZG') === 0) {
      this.forwardWeatherData(this.utf8Data)
      this.dataProtocol = new WeatherData(this.utf8Data)
      this.socket.write('pong')
    } else if (this.utf8Data.indexOf('<') === 0 || (this.socket.hasOwnProperty('device_type') && this.socket.device_type === 'crops_grow')) {
      this.dataProtocol = new CropsGrowData(this.utf8Data)
    } else if (this.utf8Data === 'pong') {
      this.log('气象站发来的心跳包数据')
    } else if (this.utf8Data.indexOf("Setting#") === 0) {
      // 系统设置
      if (this.utf8Data === "Setting#Ping") {
        this.settingSocket = this.socket
      }
      this.dataProtocol = new SettingData(this.utf8Data)
      this.dataProtocol.setDeviceSockets(this.collectDeviceSockets)
    } else {
      this.socket.write('illegal')
      this._cleanCollection()
      return
    }

    if (this.dataProtocol) {
      this.dataProtocol.setSocket(this.socket)
      this.dataProtocol.handle(this.dbPool)
    }

  }

  forwardWeatherData(data) {
    /* 设置连接的服务器 */
    if (!this.tmpClient.connected) {
      const client = this.tmpClient
      client.connect(26881, '182.151.23.104', function () {
        client.connected = true
        console.log("连接到正式服务器")
        /* 向服务器发送数据 */
        client.write(data)
        // setTimeout(() => {
        //   console.log("断开")
        //   client.end()
        //   client.destroy()
        // }, 500)
      })
    } else {
      /* 向服务器发送数据 */
      console.log("向服务器发送数据")
      this.tmpClient.write(data)
    }


    /* 监听服务器传来的data数据 */
    this.tmpClient.on("data", function (data) {
      console.log("the data of server is " + data.toString());
    })

    this.tmpClient.on("end", () => {
      this.tmpClient.connected = false
      console.log("data end")
    })
    this.tmpClient.on("close", () => {
      this.tmpClient.connected = false
      console.log("data close")
    })
    this.tmpClient.on("error", () => {
      this.tmpClient.connected = false
      console.log("data end")
    })
  }
}
