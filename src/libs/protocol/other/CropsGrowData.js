// 作物站
const BaseData = require('../BaseData')
const DbHelper = require('../../../helpers/DbHelper')
const dateFormat = require('dateformat')
const UtilsHelper = require('../../../helpers/UtilsHelper')
const request = require('request')
const systemConfig = UtilsHelper.loadConfig()
module.exports = class CropsGrowData extends BaseData {
  constructor(raw) {
    super(raw)
    this.type = 'crops_grow'
    this.type_name = '作物站'
  }
  handle(dbPool) {
    // 主要是处理心跳数据更新设备状态
    this.dbPool = dbPool
    this.parseData()
  }
  parseData() {
    // <HEARTBEAT XXXX XX>
    // <IMAGESEND XXXX XX 20160324100000>
    // <IMAGEFAILURE XXXX XX 20160324100000>
    let items = this.data.replace('<', '').replace('>', '').split(/\s+/)
    const type = items[0]
    this.socket.deviceType = 'crops_grow'
    switch (type) {
      case 'HEARTBEAT':
        this.recordHeartBeat(items)
        break
      case 'IMAGESEND':
        this.sendApiNotify(items, 'successed')
        break
      case 'IMAGEFAILURE':
        this.sendApiNotify(items, 'failed')
        break
      default:
        this.receiveData()
        break
    }
  }

  receiveData() {
    // TODO: 读取设备信息返回的数据
  }
  recordHeartBeat(items) {
    const stationId = items[1]
    const cameraId = items[2]
    this.socket.deviceId = `${stationId}_${cameraId}`
    this.saveCropsStation(stationId)
    this.sendSetCmd('FTPADDR', systemConfig.ftp.host)
    setTimeout(() => {
      this.sendSetCmd('FTPUSER', [
        systemConfig.ftp.user,
        systemConfig.ftp.pwd,
        systemConfig.ftp.path,
      ])
    }, 1000)
    setTimeout(() => {
      this.sendSetCmd('FTPENABLE', 1)
    }, 3000)
  }
  sendSetCmd(module, content) {
    module = module.toUpperCase()
    if (content instanceof Array) {
      content = content.join(' ')
    }
    const cmd = `${module} ${content}\r\n`
    this.socket.write(cmd)
  }
  sendReadCmd(module) {
    module = module.toUpperCase()
    const cmd = `${module}\r\n`
    this.socket.write(cmd)
  }
  sendApiNotify(items, status) {
    // <IMAGESEND XXXX XX 20160324100000>
    // AL_Z0018_20220630.DAT
    //Z0018_010301_01_D0001_20220529120000250_TIMING
    const stationId = items[1]
    const cameraId = items[2]
    const time = items[3]
    const date = time.substr(0, 8)
    const datFileName = `AL_${stationId}_${date}.DAT`
    const imgFileName = `${stationId}_none1_${cameraId}_none2_${time}_TIMING.jpg`
    request(
      {
        url: systemConfig.api.crops_station_image_send,
        method: 'POST',
        json: true,
        headers: {
          'content-type': 'application/json',
        },
        body: {
          status: status,
          dat: datFileName,
          image: imgFileName,
          date: date,
          time: time
        },
      },
      (err, rep, body) => {
        if (err) {
          console.log('request 请求post 出现错误 err : ', err)
          return false
        }
      }
    )
  }
  saveCropsStation(stationId) {
    let sql = `SELECT * FROM byt_crops_station WHERE station = '${stationId}' LIMIT 1`
    this.dbPool.query(sql, (err, rows, fields) => {
      const time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
      if (rows.length) {
        const id = rows[0].id
        let sql = `UPDATE byt_crops_station SET status=1, update_time='${time}' WHERE id='${id}'`
        this.log(sql)
        this.dbPool.query(sql)
      } else {
        let sql = DbHelper.generateInsertSql('byt_crops_station', {
          id: null,
          title: '未激活',
          station: stationId,
          status: 1,
          create_time: time,
          update_time: time,
        })
        this.log(sql)
        this.dbPool.query(sql, (error, result, fields) => {
          if (error) {
            this.log(error.message, 'error')
          }
        })
      }
    })
  }
}
