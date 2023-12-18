// 小型气象站
const BaseData = require('../BaseData')
module.exports = class WeatherData extends BaseData {
  constructor(raw) {
    super(raw)
    this.type = 'weather'
    this.type_name = '小型气象站'
  }
  handle(dbPool) {
    this.log('原始数据:' + this.data)
    this.dbPool = dbPool
    this.parseData()
  }

  parseData() {
    if (this.data.indexOf('23') === 0) {
      this.hexStrToAsc()
      return
    }
    if (this.data.indexOf('HZG') === 0) {
      this.parseHeartbeat()
      return
    }

    this.writeData()
  }
  writeData () {
    if (!this.socket.deviceId) {
      this.log('设备ID未记录(原因：设备未发生心跳包或注册包)', 'error')
      return
    }

    const channels = this.parseChannels()
    if (Object.keys(channels).length === 0) {
      this.log('数据解析错误', 'error')
      return
    }

    const deviceId = `${this.socket.deviceId}`
    if (deviceId === 'weather_#') {
      return
    }
    this.log(`设备编码：${deviceId}`)
    this.saveData(deviceId, channels)
  }

  parseHeartbeat() {
    this.log('解析心跳包:' + this.data)
    const deviceId = `weather_${this.data.substr(-1)}`
    this.socket.deviceId = deviceId
    this.log('记录该客户端对应设备ID=' + deviceId)
    this.saveNode(deviceId, 1, '气象站-' + deviceId, 2)
  }

  hexStrToAsc() {
    let data = this.data.replace(/\s+/g, "")
    data = data.substr(0, data.length - 12)
    let items = []
    for (var i = 0; i < data.length / 2; i++) {
      const fromIndex = 2 * i
      let value = data.substr(fromIndex, 2)
      if (!['23', '20'].includes(value)) {
        const curCharCode = parseInt(value, 16)
        items.push(String.fromCharCode(curCharCode))
      }
    }
    console.log('items:', items)
  }

  parseChannels () {
    let str = this.data.substr(2, this.data.length - 9)
    let items = str.split(/\s+/g)
    let channels = []
    for (let i = 1; i <= items.length; i++) {
      const index = i > 9 ? i.toString() : '0' + i.toString()
      const value = parseFloat(items[i - 1])
      channels['channel_' + index] = isNaN(value) ? parseFloat(value) : value
    }

    return channels
  }

  hexParseChannels() {
    const writeChannels = {
      'channl_01': 3,
      'channl_02': 3,
      'channl_03': 5,
      'channl_04': 6,
      'channl_05': 3,
      'channl_06': 6,
      'channl_07': 3,
      'channl_08': 6,
    }
  }
}