const changeDevices = [
    'c4051_1',
    // 'c4067_1'
]
let changedDevices = []
const ipCmd = "IP,1,182.151.23.104:26881\r\n"

/* 引入net模块 */
var net = require("net");

/* 创建TCP客户端 */
var client = net.Socket();

function sleep(ms) {
    return new Promise(resolve=>setTimeout(resolve, ms))
}

let timer = null
/* 设置连接的服务器 */
client.connect(26881, '127.0.0.1', function () {
    console.log("connect the server");

    /* 向服务器发送数据 */
    client.write("Setting#Ping");
    if (timer) {
        timer = null
        clearInterval(timer)
    }
    timer = setInterval(() => {
        client.write("Setting#Ping");
    }, 5000);
})

/* 监听服务器传来的data数据 */
client.on("data", function (data) {
    const utf8Data = data.toString()
    console.log("the data of server is " + utf8Data)
    if  (utf8Data === "Setting#Yes") {
        // 允许配置
        changeDevices.filter(m => !changedDevices.includes(m)).forEach(async device => {
            console.log('id:', device)
            const cmd = `Setting#IP#${device}#${ipCmd}`
            console.log('send cmd:', cmd)
            client.write(cmd)
            await sleep(1500)
        })
    }

    if (utf8Data.indexOf("Setting#IP#OK#") === 0) {
        const items = utf8Data.split('#')
        changedDevices.push(items[items.length - 1])
    }

    if (utf8Data === "Setting#Close") {
        if (timer) {
            timer = null
            clearInterval(timer)
            changedDevices = []
        }
    }
})

/* 监听end事件 */
client.on("end", function () {
    console.log("data end");
    if (timer) {
        timer = null
        clearInterval(timer)
        changedDevices = []
    }
})

client.on("error", function(error) {
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
        changedDevices = []
    }
    process.exit(0)
  })