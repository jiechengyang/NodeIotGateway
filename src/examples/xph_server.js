var net = require('net');
const fs = require('fs');
var xph = require('./../lib/xph');
var util = require('util');
var MySQLChassis = require('mysql-chassis');
var dateFormat = require('dateformat');
const UtilsHelper = require('./UtilsHelper');
const localConfigJsonFile = __dirname + "/config/params-local.js";
if (!UtilsHelper.fsExistsSync(localConfigJsonFile)) {
    const data = new Uint8Array(Buffer.from("{\n}"));
    fs.writeFileSync(localConfigJsonFile, data);
}
var config = {
    cmd: {
        readData1: '01 03 00 00 F1 D8', // 01 03 00 00 00 10 44 06 | 01 03 00 00 F1 D8
        readData2: '02 03 00 00 F1 D8', // 02 03 00 00 00 10 44 06 | 02 03 00 00 F1 D8
        readData3: '03 03 00 00 F1 D8', // 03 03 00 00 00 10 44 06 | 03 03 00 00 F1 D8
        readData4: '04 03 00 00 F1 D8' // 04 03 00 00 00 10 44 06 | 04 03 00 00 F1 D8
    },
    mysql: {
        database: '',
        user: '',
        password: '',
        host: 'localhost',
        port: 3306
    },
    deviceIds: [
    ],
    frequency: 1000 * 60 * 60,
    port: 6008,
    host: '0.0.0.0',
    minChannelNum: 4
};
const db = new MySQLChassis(config.mysql);
const connection = db.connection;
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});
var hexData, utf8Data, allData = [],
    clients = [],
    allData2 = [];

var maxChannelNum = 32;

function sendHex(socket, command) {
    command = command || '01 03 00 00 F1 D8';
    command = command.replace(/[\s]*/ig, '');
    if (socket) {
        socket.write(command, 'hex');
    }
}

function inArray(val, arr) {
    var flag = false;
    for (var i = 0; i < arr.length; i++) {
        console.log(val, arr[i]);
        if (val === arr[i]) {
            flag = true;
            break;
        }
    }

    return flag;
}

function isNull(val) {
    var tmp = false;
    if (val === null || val === '' || val === undefined || val === 'undefined' || typeof val === 'undefined' || val.length === 0) {
        tmp = true;
    }

    return tmp;
}

function addData(socket, db, realData, k) {
    for (var i = 0; i < realData.length / 4; i++) {
        if (k > 32) {
            util.log('from ' + socket.remoteAddress + ': ChannelNum:' + k);
            break;
        }
        var value = realData.substr(4 * i, 4);
        var index = i + 1;
        index = index > 9 ? index.toString() : '0' + index.toString();
        // console.log('value:', value);
        allData['channel_' + index] = value.toUpperCase() === '7FFF' ? null : xph.parseSingleHexData(value);
        k++;
    }

    if (!allData) {
        console.log('---Err---- Invalid allData From ' + socket.remoteAddress + ': ' + hexData  + "'-------'r\n");
        return false;
    }

    if (allData.length < config.minChannelNum) {
        console.log('---Err---- allData minChannelNum is: ' + config.minChannelNum + "'-------'r\n");
        return false;
    }

    insertData(db, allData, socket.deviceId, 1);
}

function insertData(db, allData, device_id, node_address) {
    console.log('allData:', allData);
    var dataLen = Object.keys(allData).length;
    console.log('Object.keys(allData).length:', dataLen);
    // console.log('typeof allData:', typeof  allData);
    if ( (typeof  allData === 'object' && dataLen== 0) || (typeof  allData === 'array' && allData.length == 0)) {
        console.log('---Err---- channel allData null' + " -------\r\n");
        return false;
    }

    if (dataLen < config.minChannelNum ) {
        console.log('---Err---- channel num low(<' + config.minChannelNum  + ')' + " -------\r\n");
        return false;
    }

    node_address = node_address || 1;
    var insertValues = allData;
        insertValues.id = null,
        insertValues.device_id = device_id;
        insertValues.node_address = node_address,
        insertValues.hex_data = hexData,
        insertValues.create_time = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    console.log('insertValues:', insertValues);
    try {
            db.insert('byt_xph_data', insertValues)
            .then(function (results) {
                util.log('Insert succeed! ' + results.insertId)
            }).catch(err => {
                console.log(err)
        });
    } catch(e) {
        console.err('db Insert error:', e);
    }
}


function createData(socket, realData, allData, allData2) {
    var k = 1;
    for (var i = 0; i < realData.length / 4; i++) {
        if (k > 32) {
            console.log('---Err---- ' + 'from ' + socket.remoteAddress + ': ChannelNum:' + k + " -------\r\n");
            break;
        }
        // if (k > 4) {
        //     var value = realData.substr(4 * i, 4);
        //     var index = i + 1;
        //     index = index > 9 ? index.toString() : '0' + index.toString();
        //     // console.log('value:', value);
        //     allData2['channel_' + index] = value.toUpperCase() === '7FFF' ? null : xph.parseSingleHexData(value);
        // } else {
        //     var value = realData.substr(4 * i, 4);
        //     var index = i + 1;
        //     index = index > 9 ? index.toString() : '0' + index.toString();
        //     allData['channel_' + index] = value.toUpperCase() === '7FFF' ? null : xph.parseSingleHexData(value);
        // }
        var value = realData.substr(4 * i, 4);
        var index = i + 1;
        index = index > 9 ? index.toString() : '0' + index.toString();
        allData['channel_' + index] = value.toUpperCase() === '7FFF' ? null : xph.parseSingleHexData(value);
        k++;
    }
    insertData(db, allData, socket.deviceId, 1);
    // insertData(db, allData2, socket.deviceId, 2);
}

var server = net.createServer(function connectionListener(socket) {
    console.log('Client come in: ' + socket.remoteAddress + ':' + socket.remotePort);
    sendHex(socket, config.cmd.readData1);
    socket.firstData = true;
    socket.firstAdd = true;
    socket.on('data', function (data) {
        hexData = data.toString('hex');
        var utf8Data = data.toString('utf8');
        var allData = [], allData2 = [];
        if (socket.firstData) {
            socket.firstData = false;
            if (inArray(utf8Data, config.deviceIds)) {
                socket.deviceId = utf8Data;
                clients[utf8Data] = socket
            } else {
                console.log('---Err---- ' + 'Invalid reg data From ' + socket.remoteAddress + ': ' + hexData + " -------\r\n\r\n\r\n");
                return false;
            }
        }
        var realDataLen = parseInt(hexData.substr(4, 4), 16);
        var realData = hexData.substr(8, hexData.length);
        realData = realData.substr(0, realData.length - 4);
        var k = 1;
        // console.log('socket.deviceId:%s, allData:%o', socket.deviceId, allData);
        if (isNull(socket.deviceId)) {
            console.log('---Err---- ' + 'Invalid deviceId From ' + socket.remoteAddress + ': deviceId:' + socket.deviceId + " -------\r\n\r\n\r\n");
            return false;
        } else {
           if (realDataLen !== realData.length / 2) {
                console.log('-------------- Err--- realDataLen= ' + realDataLen +' ----------------------' + "\r\n");
                console.log('-------------- Err--- realData RealLen= ' + realData.length / 2 +' ----------------------' + "\r\n");
                console.log('-------------- Err--- realData= ' + realData +' ----------------------' + "\r\n");
                console.log('---Err---- ' + '数据长度与实际数据的长度不一样 From  deviceId:' + socket.deviceId + " -------\r\n\r\n\r\n");
                return false;
           }
        }
       // util.log('hexData:' + hexData)；
       console.log('-------------- DTU Reg ID ----------------------' + "\r\n");
       console.log('-------------- ID= '+ socket.deviceId +' ----------------------' + "\r\n");
       console.log('-------------- DTU hexData ----------------------' + "\r\n");
       console.log('-------------- hexData= ' + hexData +' ----------------------' + "\r\n");
       console.log('-------------- DTU utfData ----------------------' + "\r\n");
       console.log('-------------- utfData= ' + utf8Data +' ----------------------' + "\r\n");
       console.log('-------------- realDataLen= ' + realDataLen +' ----------------------' + "\r\n");
       console.log('-------------- realData RealLen= ' + realData.length / 2 +' ----------------------' + "\r\n");
       console.log('-------------- realData= ' + realData +' ----------------------' + "\r\n");
       createData(socket, realData, allData, allData2);
       console.log('-------------- END ----------------------' + "\r\n");
        setTimeout(function () {
            sendHex(socket, config.cmd.readData1);
        }, config.frequency);
    });

    socket.on('end', function () {
        util.log('one client end');
        socket.deviceId = null;
    });

    socket.on('close', function(had_error) {
        socket.deviceId = null;
        socket.destroy();
        util.log('one client close');
    });

    socket.on('error', function(ex) {
        console.log('error client to deviceID:%s', socket.deviceId);
        socket.deviceId = null;
        socket.destroy();
        console.error('error', ex);
    });
});

server.listen(config.port, config.host);
util.log('Server is listening on ' + config.host + ':' + config.port);

process.on('unhandledRejection', (reason, promise) => {
    console.log('未处理的拒绝：', promise, '原因：', reason);
    // 记录日志、抛出错误、或其他逻辑。
});