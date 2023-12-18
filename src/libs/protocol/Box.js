const utilsHelper = require('../../helpers/UtilsHelper')
const hexTools = require('../HexTools')
const xphHelper = require('../xph')
var stringHelper = require('../../helpers/StringHelper')

/**
 * 盒子协议解析类
 */
module.exports = class Box {
    defaultHeadHex = '0d 24'
    defaultFootHex = '0d 0a'
    constructor(hexData) {
        // 设备->服务的属性定义
        this.hexData = hexData
        this.headHex = hexData.substr(0, 4) //0d 24
        this.packageLenHex = hexData.substr(4, 4)
        //帧头+帧长度+功能码+Data+校验码+帧尾
        this.packageLen = parseInt(this.packageLenHex.replace('00', ''), 16)
        const noDataLen = 2 + 2 + 1 + 1 + 2
        this.dataLen = this.packageLen - noDataLen
        this.funcHex = hexData.substr(8, 2)
        this.dataHex = hexData.substr(10, this.dataLen * 2)
        this.crcHex = hexData.substr(-6, 2)
        this.footHex = hexData.substring(hexData.length - 4)//'0d 0a'
        console.log('this.headHex:', this.headHex)
        console.log('this.packageLen:', this.packageLen)
        console.log('this.packageLenHex:', this.packageLenHex)
        console.log('this.funcHex:', this.funcHex)
        console.log('this.dataHex:', this.dataHex)
        console.log('this.footHex:', this.footHex)
        this.parseData()
        this.computedCrc = this.computeCrc(this.packageLenHex, this.funcHex, this.dataHex)
        if (this.computedCrc != `${this.crcHex}`) {
            this.crcStatus = '0f'
        } else {
            this.crcStatus = '01'
        }
        // console.log(this.version,this.idHex, this.id, this.versionHex )
    }
    validatePackage() {
        if (this.headHex.toLowerCase() === this.replaceEmptyString(this.defaultHeadHex) 
        && this.footHex.toLowerCase()  === this.replaceEmptyString(this.defaultFootHex)) {
            return true
        }

        return false
    }
    parseData() {
        if (this.funcHex === '80') {
            return this.parseDeviceLoginData()
        }
        if (this.funcHex === '81') {
            return this.parseDeviceHeartbeatData()
        }
        if (this.funcHex === '82') {
            return this.parseDeviceIccIDData()
        }
        if (this.funcHex === '73') {
            return this.parsePullData()
        }
    }
    parseDeviceLoginData() {
        // 登陆服务器（设备to服务器）
        this.idHex = this.dataHex.substr(0, 28)
        this.id = utilsHelper.hexToString(this.idHex)
        this.id = this.id.replace('\x00\x00', '')
        console.log('device id is:', this.id)
        this.versionHex = this.dataHex.substr(28, 2)
        this.version = parseInt(this.versionHex, 16)
    }
    parseDeviceHeartbeatData() {
        // 设备心跳
        // 0d24 2300 81 38303230323330303130353100001d000000000000000000000000 b10d0a
        // 38303230323330303130353100001d000000000000000000000000
        // 38 30 32 30 32 33 30 30 31 30 35 31 00 00 1d 000000000000000000000000
        //3830323032333030313035310000
        this.idHex = this.dataHex.substr(0, 28)
        this.id = utilsHelper.hexToString(this.idHex)
        this.id = this.id.replace('\x00\x00', '')
        console.log('设备心跳， id is:', this.id)
        this.signalHex = this.dataHex.substr(28, 2)
        this.signal = parseInt(this.signalHex, 16)
        this.temperatureHex = this.dataHex.substr(30, 4)
        this.temperature = xphHelper.parseSingleHexData(this.temperatureHex)
        this.batteryHex = this.dataHex.substr(36, 2)
        this.battery = parseInt(this.batteryHex, 16)
        // console.log(this.idHex, this.signalHex, this.temperatureHex, this.batteryHex)
        // 数据库记录 信号 温度 电压
        console.log(this.id, this.signal, this.temperature, this.battery)
    }
    parsePullData() {
        // this.order = this.dataHex.substr(12, 28)
        const order_no_hex = this.dataHex //this.headHex.substr(10, 30)
        console.log('parse order:', order_no_hex)
        //013136373939323033353832393633
        const codes = stringHelper.byteSplit(order_no_hex, 2)
        let order = ''
        codes.map(code => {
            // console.log(eval(`0x${code}`).toString(16))
            let num = parseInt(`0x${code}`, 16)
            order += String.fromCharCode(num)
            // console.log(String.fromCharCode(num))
        })

        this.order = order.replace('\x01', '')
    }
    parseDeviceIccIDData() {
        //ICCID/IMEI回复
    }
    makeReplayDeviceLoginCmd() {
        let funcHex = '80'
        let cmd = `${this.defaultHeadHex}`
        //整帧数据的长度，帧头+帧长度+功能码+Data+校验码+帧尾
        //2个字节顺序为：低位在前，高位在后，比如帧长度为40个字节，填写：0x28 0x00
        const packageLen = (2 + 2 + 1 + 6 + 1 + 14 + 1 + 2)
        let packageLenHex = stringHelper.padRight(packageLen.toString(16), 4, '0')
        cmd += ` ${packageLenHex} ${funcHex}`
        const timeHexStr = this.getTimeHexStr()
        let dataHex = `${timeHexStr} ${this.crcStatus} 00 00 00 00 00 00 00 00 00 00 00 00 00 00`
        console.log('dataHex:', dataHex)
        cmd += ` ${dataHex} `
        // crc = 帧长度、功能码、Data异或(即：帧长度^功能码^Data)
        var crc = this.computeCrc(packageLenHex, funcHex, this.replaceEmptyString(dataHex))
        var crcStr = stringHelper.padRight(crc, 2, '0')
        cmd += crcStr + ` ${this.defaultFootHex}`
        // console.log('replayDeviceLoginCmd is:', cmd)
        return cmd.toUpperCase()
    }

    makeReplayHeartBeatCmd() {
        // 0D 24 1A 00 81 17 30 E0 F0 00 2B 00 00 00 00 00 00 00 00 00 00 00 00 87 0D 0A 
        // 0D 24 1A 00 81 15 07 16 15 2A 2A 00 00 00 00 00 00 00 00 00 00 00 00 8A 0D 0A
        let funcHex = '81'
        let cmd = `${this.defaultHeadHex}`
        //整帧数据的长度，帧头+帧长度+功能码+Data+校验码+帧尾
        //2个字节顺序为：低位在前，高位在后，比如帧长度为40个字节，填写：0x28 0x00
        const packageLen = 2 + 2 + 1 + 6 + 12 + 1 + 2
        let packageLenHex = stringHelper.padRight(packageLen.toString(16), 4, '0')
        cmd += ` ${packageLenHex} ${funcHex}`
        const timeHexStr = this.getTimeHexStr()
        let dataHex = `${timeHexStr} 00 00 00 00 00 00 00 00 00 00 00 00`
        console.log('makeReplayHeartBeatCmd dataHex:', dataHex)
        cmd += ` ${dataHex} `
        // crc = 帧长度、功能码、Data异或(即：帧长度^功能码^Data)
        var crc = this.computeCrc(packageLenHex, funcHex, this.replaceEmptyString(dataHex))
        var crcStr = stringHelper.padRight(crc, 2, '0')
        cmd += crcStr + ` ${this.defaultFootHex}`
        return cmd.toUpperCase()
    }

    makeGetICCIDCmd() {
        let cmd = this.defaultHeadHex
        //帧长度、功能码、Data异或(即：帧长度^功能码^Data)
        //整帧数据的长度，帧头+帧长度+功能码+Data+校验码+帧尾
        let packageLen = 2 + 2 + 1 + 1 + 2
        let packageLenHex = stringHelper.padLeft(packageLen.toString(16), 2, '0')
        packageLenHex = stringHelper.padRight(packageLenHex, 4, '0')
        let funcHex = '82'
        let crcHex = this.computeCrc(packageLenHex, funcHex, null)
        cmd += ` ${packageLenHex} ${funcHex} ${crcHex} ${this.defaultFootHex}`
        return cmd
    }

    replaceEmptyString(str) {
        return stringHelper.replaceEmptyString(str)
    }

    getTimeHexStr() {
        // 年月日时分秒（ 比如：18年10月26日19点15分10秒  = 0x12 0x0a 0x1a 0x13 0x0f 0x0a）
        const now = new Date()
        const yearStr = now.getFullYear().toString()
        const year = parseInt(yearStr.substr(2))
        let yearHex = year.toString(16)
        const month = now.getMonth() + 1
        let monthHex = stringHelper.padRight(month.toString(16), 2, '0')
        let dateHex = stringHelper.padRight(now.getDate().toString(16), 2, '0')
        let hourHex = stringHelper.padRight(now.getHours().toString(16), 2, '0')
        let minuteHex = stringHelper.padRight(now.getMinutes().toString(16), 2, '0')
        let secondHex = stringHelper.padRight(now.getSeconds().toString(16), 2, '0')

        return `${yearHex} ${monthHex} ${dateHex} ${hourHex} ${minuteHex} ${secondHex}`
    }

    /**
     * 计算校验码：帧长度、功能码、Data异或(即：帧长度^功能码^Data)
     */
    computeCrc(packageLenHex, funcHex, dataHex = null) {
        const dataItems = this.dataHexToArray(dataHex)
        // console.log('dataItems:', dataItems, dataItems.length * 2, dataHex.length)
        packageLenHex = `0x${packageLenHex.replace('00', '')}`
        let crc = packageLenHex ^ `0x${funcHex}`
        dataItems.forEach(item => {
            crc = crc ^ `0x${item}`
        });
        // console.log('测试：', 0x24 ^ 0x00 ^ 0x80
        //      ^ 0x38 ^ 0x30 ^ 0x32 ^ 0x30 ^ 0x32 ^ 0x33 ^ 0x30 ^ 0x30 ^ 0x31 ^0x30 ^ 0x35 ^ 0x31
        //      ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00 ^ 0x00)
        // console.log(crc, hexTools.num2Hex(crc))
        return hexTools.num2Hex(crc)
    }

    dataHexToArray(dataHex, slice = 2) {
        return stringHelper.byteSplit(dataHex, slice)
    }
}