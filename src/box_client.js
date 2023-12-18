
/* 引入net模块 */
var net = require("net");

/* 创建TCP客户端 */
var client = net.Socket();

var stringHelper = require('./helpers/StringHelper')

const deviceId = '802023001086'
const fix = 'BoxMall#' + deviceId + '#'

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function sendCmd(socket, cmd) {
    cmd = `${fix}${cmd}`
    socket.write(cmd)
}

function computeCrc(packageLenHex, funcHex, dataHex = null) {
    const dataItems = dataHexToArray(dataHex)
    // console.log('dataItems:', dataItems, dataItems.length * 2, dataHex.length)
    packageLenHex = `0x${packageLenHex.replace('00', '')}`
    let crc = packageLenHex ^ `0x${funcHex}`
    dataItems.forEach(item => {
        crc = crc ^ `0x${item}`
    });
    return crc.toString(16).toLocaleUpperCase()
}

function dataHexToArray(dataHex, slice = 2) {
    let items = []
    if (!dataHex) {
        return items
    }
    const len = dataHex.length
    for (let i = 0; i < len; i += slice) {
        let value = dataHex.substr(i, slice)
        items.push(value)
    }

    return items
}

function testPullCmd() {
    // 0d24 2000 73 01003136373836303336373835313938 00 00 00 00 00 00 00 00 53 0d0a
    //帧头：0D 24 
    //帧长度：2C 00 
    //功能码：61 
    //地址码：00 
    //商品数量：02 
    //01 01 00 
    //02 01 00 
    //升降台状态：01 
    //00 00 00 00 00 00 00 00 00 00 00 00 00 
    //31 32 33 34 35 36 37 38 39 30 31 32 33 34 
    //48 
    //0D 0A 
    var cmd = '0D 24';
    var tradOrder = new Date().getTime() + '1';
    var count = 2;
    var funcHex = '61';
    var addrHex = '00';
    var countHex = stringHelper.padLeft(count.toString(16), 2, '0')
    var goodsHexItems = []
    for(var i = 1; i<=count; i++) {
        var cellHex = stringHelper.padLeft(i.toString(16), 2, '0')
        var openTimeHex = '05'
        var fallOffTimeHex = '00'
        goodsHexItems.push(`${cellHex} ${openTimeHex} ${fallOffTimeHex}`)
    }
    var goodsHex = goodsHexItems.join(' ')
    var reserveHex = '00 00 00 00 00 00 00 00 00 00 00 00 00 00'
    var tradOrderCodeItems = stringHelper.byteSplit(tradOrder, 1)
    var tradOrderHexItems = tradOrderCodeItems.map(str => {
        return str.charCodeAt().toString(16)
    })
    var tradOrderHex = tradOrderHexItems.join(' ')
    var dataHex = `${addrHex} ${countHex} ${goodsHex} ${tradOrderHex} ${reserveHex}`
    console.log('goodsHex:', goodsHex)
    console.log('tradOrderHex:', tradOrderHex)
    // 帧头+帧长度+功能码+Data+校验码+帧尾；
    var packageLen = (2 + 2 + 1 + 1 + 2) + 1 + 1 + count * 3 + 14 + 14
    var packageLenHex = stringHelper.padRight(packageLen.toString(16), 4, '0')
    var crcHex = computeCrc(packageLenHex, funcHex, dataHex)
    cmd += ` ${packageLenHex} ${funcHex} ${dataHex} ${crcHex} 0D 0A`
    console.log('pull cmd:', cmd)
    var test = '0D 24 2c 00 61 00 02 01 05 00 02 05 00 31 36 37 38 38 35 36 38 38 37 30 32 35 31 00 00 00 00 00 00 00 00 00 00 00 00 00 00 4D 0D 0A'
    console.log('p l:', test.split(' ').length)
    //帧头： 0D 24 
    //包长度： 2c 00 
    //功能码：61 
    //地址码：00 
    //商品数量：02 
    //01 05 00 
    // 02 05 00 
    //订单码：31 36 37 38 38 35 36 38 38 37 30 32 35 31 
    //预留：00 00 00 00 00 00 00 00 00 00 00 00 00 00 
    //crc:4D 
    //0D 0A
    return cmd
}

function testICCIDCmd() {
        //0D 24 08 00 82 8A 0D 0A
    //0D 24 08 00 82 8A 0D 0A
    var cmd = '0D 24 08 00 82'
    var crc = computeCrc('0800', '82')
    cmd += ` ${crc} 0D 0A`
   
    console.log('iccid cmd:', cmd)
    return cmd
}

function testChannelTestCmd() {
    var cmd = '0D 24';
    var packageLen = 2 + 2 + 1 + 1 + 1 + 1 + 1 + 2
    var packageLenHex = stringHelper.padRight(packageLen.toString(16), 4, '0')
    var funcHex = '65'
    var addrHex = '00'
    var channelHex = '01'
}
let timer = null
/* 设置连接的服务器 127.0.0.1  */
client.connect(12202, '139.9.153.83', function () {
    console.log("connect the box server");
    /* 向服务器发送数据 */
    var cmd1 = testPullCmd()
    var cmd2 = testICCIDCmd()
    var cmd3 = '0d 24 09 00 53 00 5A 0D 0A'
    var cmd4 = '0d24200073010031363738363033363738353139380000000000000000530d0a'
    sendCmd(client, `TEST#${cmd4}`)
    // sendCmd(client, `PULL#${cmd1}`)
    
    setTimeout(() => {
        client.pause()
        client.end()
        client.destroy()
    }, 200)
    // if (timer) {
    //     timer = null
    //     clearInterval(timer)
    // }
    // timer = setInterval(() => {
    //     sendCmd(client, 'Ping')
    // }, 5000);
})

/* 监听服务器传来的data数据 */
client.on("data", function (data) {
    const utf8Data = data.toString()
    console.log("the data of box server is " + utf8Data)
})

/* 监听end事件 */
client.on("end", function () {
    console.log("data end");
    if (timer) {
        timer = null
        clearInterval(timer)
    }
})

client.on("error", function (error) {
    console.error("connect error:", error)
    if (timer) {
        timer = null
        clearInterval(timer)
        changedDevices = []
    }
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('[客户端] 停止连接服务')
    if (timer) {
        timer = null
        clearInterval(timer)
    }
    process.exit(0)
})