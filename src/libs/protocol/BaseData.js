const log4js = require('../logger/log')
const logger = log4js.getLogger('default')
const DbHelper = require('../../helpers/DbHelper')
const dateFormat = require('dateformat')
const DEVICE_TYPE = 10
module.exports = class BaseData {
  constructor(raw) {
    this.type = ''
    this.type_name = ''
    this.data = raw
  }
  setSocket(socket) {
    this.socket = socket
    this.socket.device_type = this.type
  }
  saveData(deviceId, channelData, nodeAddress = 1) {
    let node_address = nodeAddress || 1
    let insertValues = channelData
    insertValues.id = null
    insertValues.device_id = deviceId
    insertValues.device_type = DEVICE_TYPE
    insertValues.node_address = node_address
    insertValues.create_time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
    try {
      let sql = DbHelper.generateInsertSql('byt_xph_data', insertValues)
      this.log('Insert Sql Is:' + sql)
      console.log('Insert Sql Is:' + sql)
      this.dbPool.query(sql, (error, result, fields) => {
        if (error) {
          this.log(error.message, 'error')
          console.error(error.message)
          return
        }
        this.log('Insert succeed! ' + result.insertId)
      })
    } catch (e) {
      this.log(`db Insert error:${e.message}`, 'error')
    }
  }
  saveNode(deviceId, nodeAddress, name, collectType) {
    let sql = `SELECT id FROM byt_iot_node WHERE device_type='${DEVICE_TYPE}' AND device_code='${deviceId}' AND node_address='${nodeAddress}' AND collect_type='${collectType}' LIMIT 1`
    this.dbPool.query(sql, (err, rows, fields) => {
      const time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
      if (rows.length) {
        const id = rows[0].id
        let sql = `UPDATE byt_iot_node SET device_status=1, update_time='${time}' WHERE id='${id}'`
        this.log(sql)
        this.dbPool.query(sql)
      } else {
        let sql = DbHelper.generateInsertSql('byt_iot_node', {
          id: null,
          name: name,
          collect_type: collectType,
          device_type: DEVICE_TYPE,
          device_code: deviceId,
          node_address: nodeAddress,
          device_status: 1,
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
  log(msg, type = 'info') {
    msg = `[${this.type_name}] --- ${msg} --- \r\n`
    if ('error' === type) {
      logger.error(msg)
    } else {
      logger.info(msg)
    }
  }
}
