const UtilsHelper = require('../../helpers/UtilsHelper')
const xphHelper = require('../xph')
const BaseCollectionClient = require('./BaseCollectionClient')
const CRC16 = require('../CRC16')
module.exports = class XphModbusCollectionClient extends BaseCollectionClient {
    constructor(socket, collectSockets) {
        super()
        socket.isFirsTransfer = true
        const cmd = this.generateSendCommand('00', '0000', '0053')
        this.log('当前读指令为: ' + cmd.replace(/[\s]*/ig, ''))
        UtilsHelper.sendHexCmd(socket, cmd)
        socket.interval = setInterval((_socket, cmd) => {
            UtilsHelper.sendHexCmd(_socket, cmd, true)
        }, this.systemConfig.frequency, socket, cmd)
        this.socket = socket
        this.collectSockets = collectSockets
        this.handler()

    }

    setDbPool(pool) {
        this.dbPool = pool
    }

    onData(data) {
        let hexData = data.toString('hex')
        let utf8Data = data.toString('utf8')
        if ('ping' === utf8Data) {
            // TODO: 心跳存活检测
            return
        }
        this.log('Receive Hex Data Is ' + hexData)
        this.log('Receive utf8 Data Is ' + utf8Data)
        if (this.socket.isFirsTransfer) {
            this.socket.isFirsTransfer = false
            let res = this._registerDevice(hexData, utf8Data)
            return
        }
        let realDataLen = this._getRealDataLength(hexData),
            realData = this._getRealData(hexData)
        if (realDataLen !== realData.length / 2) {
            this.log('realDataLen= ' + realDataLen)
            this.log('realData RealLen= ' + realData.length / 2)
            this.log('realData= ' + realData)
            this.log('数据长度与实际数据的长度不一样 From  deviceId:' + this.socket.deviceId, 'error')
            return
        }

        this.hexData = hexData
        this.utf8Data = utf8Data
        this.realDataLen = realDataLen
        this.realData = realData
        this._writeDataLog()
        this.createData()
        this.log('***  --END-- ***')
    }

    generateSendCommand(dAddr = '00', rSIndex = '00 00', rEIndex = '00 20') {
        let cmd = `${dAddr} 03 ${rSIndex} ${rEIndex} `
        // crc 校验
        let crc = CRC16.ToModbusCRC16(cmd)
        this.log('CRC-16/MODBUS校验计算结果: ' + crc)
        cmd += crc

        return cmd
    }

    createDataByDb() {
        let nodeNumber = this.realData.length / 12

        this.parseAndSaveData(nodeNumber)

    }

    parseAndSaveData(nodeNumber) {
        let nodeData = []
        for (let i = 0; i < nodeNumber; i++) {
            let channelData = []
            let nodeAddress = i + 1
            // console.log('##### node address = %s ##### ', nodeAddress)
            for (let j = 0; j < 4; j++) {
                let fromIndex = 4 * j + i * 16
                let value = this.realData.substr(fromIndex, 4),
                    index = j + 1
                // console.log('fromIndex:%s,value:%s,index:%s', fromIndex, value, index)
                index = index > 9 ? index.toString() : '0' + index.toString()
                channelData['channel_' + index] = value.toUpperCase() === '7FFF' ? null : xphHelper.parseSingleHexData(value)
            }
            // console.log('##### node address end ##### ')
            nodeData.push(channelData)
        }

        console.log('nodeData:', nodeData)
        for (let i =0; i < nodeData.length;i++) {
            let nodeAddress = i + 1
            let channelData = nodeData[i]
            this.saveDb(this.socket.deviceId, channelData, nodeAddress)
        }
    }

    _registerDevice(hexData, utf8Data) {
        let deviceId = utf8Data
        if (UtilsHelper.inArray(deviceId, this.systemConfig.useModusDeviceIds)) {
            this.socket.deviceId = deviceId
            this.collectSockets[deviceId] = this.socket
            return true
        } else {
            UtilsHelper.log('发现未注册的设备：' + deviceId)
            this.socket.write('该设备未注册，请先注册')
            this.socket.end()
            return false
        }
    }

    _getRealDataLength(hexData, removeWeatherNode = true) {
        let length = parseInt(hexData.substr(4, 2), 16)
        console.log('parse length:', length)
        if (removeWeatherNode) {
            length -= 64
        }
        return length
    }

    _getRealData(hexData, removeWeatherNode = true) {
        let startIndex = 6
        if (removeWeatherNode) {
            startIndex += 128
        }

        let realData = hexData.substr(startIndex, hexData.length)
        return realData.substr(0, realData.length - 4)
    }
}