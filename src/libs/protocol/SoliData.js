// 插管式土壤墒情
const BaseData = require('./BaseData')
module.exports = class SoliData extends BaseData {
  constructor(raw) {
    super(raw)
    this.type = 'soli'
    this.type_name = '插管式土壤墒情'
  }
  handle(dbPool) {
    this.dbPool = dbPool
    this.log('原始数据:' + this.data)
    this.dataObj = this.parseData()
    switch (this.dataObj.type) {
      case '0':
        // 数据帧
        this.writeData()
        break;
      case '1':
        // 命令帧
        this.receiveDeviceCommand()
        break;
      case '2':
        // 心跳帧
        this.recordHeartbeat()
        break;
    }
  }
  parseData() {
    let firstDataStr = this.parseRawBody()
    let obj = {}
    let dataItems = firstDataStr.split(',')
    dataItems.forEach(value => {
      let val = value.split(':')
      if (val.length === 2) {
        obj[val[0]] = val[1]
      }
    })

    return obj
  }
  writeData() {
    const channels = this.parseChannels()
    if (Object.keys(channels).length === 0) {
      return
    }
    const deviceId = `${this.dataObj.station}_${this.dataObj.device}`
    this.log(`区站号：${this.dataObj.station}，设备编号：${this.dataObj.device}，设备编码：${deviceId}`)
    this.socket.deviceId = deviceId
    this.saveNode(deviceId, 1, '墒情-' + deviceId, 1)
    this.saveData(deviceId, channels)
  }
  parseChannels() {
    const writeChannels = [
      'SMV1',
      'SMV2',
      'SMV3',
      'SMV4',
      'SMF1',
      'SMF2',
      'SMF3',
      'SMF4',
      'ST1',
      'ST2',
      'ST3',
      'ST4',
      'ST5',
      'ST6',
      'ST7',
      'ST8',
      'ST9',
      'ST10',
      'RF',
      'TAT',
      'TAH'
    ]
    let channels = []
    for (let i = 0; i < writeChannels.length; i++) {
      const channel = writeChannels[i]
      if (!this.dataObj.hasOwnProperty(channel)) {
        continue
      }
      const num = i + 1;
      const index = num > 9 ? num.toString() : '0' + num.toString()
      const value = this.dataObj[channel]
      channels['channel_' + index] = isNaN(value) ? parseFloat(value) : value
    }

    return channels
  }
  receiveDeviceCommand() {
    this.log("服务端向设备下方指令后接收到土壤墒情设备的反馈:" + this.parseRawBody())
  }
  recordHeartbeat() {
    let firstDataStr = this.parseRawBody()
    const deviceId = 'c' + firstDataStr.substr(-4) + '_1'
    this.log("土壤墒情设备发送心跳帧:" + firstDataStr)
    console.log('before send:', this.socket.bytesWritten)
    // this.socket.write("DATETIME\r\n")
    // console.log('DATETIME after send:', this.socket.bytesWritten)
    // debug
    // const ipCmd = "IP,1,182.151.23.104:26881\r\n"
    // this.log(`修改设备${deviceId}的ip和端口：${ipCmd}`)
    // this.socket.write(ipCmd)
  }
  parseRawBody() {
    let dataRows = this.data.split("\r\n")

    return dataRows[0]
  }
}