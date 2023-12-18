// 系统配置
const BaseData = require('../BaseData')
module.exports = class SettingData extends BaseData {
    constructor(raw) {
        super(raw)
        this.type = 'setting'
        this.type_name = '系统配置'
        this.deviceSockets = []
    }
    setDeviceSockets(sockets) {
        for (var id in sockets) {
            const socket = sockets[id]
            if (["soli", "weather"].includes(socket.device_type)) {
                this.deviceSockets.push(socket)
            }
        }
    }
    handle(dbPool) {
        this.log('原始数据:' + this.data)
        this.dbPool = dbPool
        this.parseData()
    }
    parseData() {
        if (this.data === "Setting#Ping") {
            this.socket.write("Setting#Yes")
            return
        }
        if (this.data.indexOf("Setting#IP#") === 0) {
            const items = this.data.split("#")
            console.log('items:', items)
            console.log('device sockets count is:', this.deviceSockets.length)
            this.deviceSockets.forEach(socket => {
                if (socket.deviceId  === items[2]) {
                    this.log(`修改设备${socket.deviceId}的ip和端口`)
                    socket.write(items[3])
                    this.socket.write("Setting#IP#OK#" + items[2])
                } else {
                    this.log(`设备${socket.deviceId}暂不修改ip和端口`)
                }
            })
        }
    }
}