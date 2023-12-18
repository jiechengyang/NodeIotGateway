var simulateData = require('../libs/xph_data');
var net = require('net');

var config = {
    ip: 'localhost',
    port: 5006,
    cmd: '01030000F1D8'
};
client = net.connect(config.port, config.ip, function connectListener() {
        console.log('Connect to ' + config.ip);
    });

client.on('error', function (ex) {
    console.error('error', ex);
})

client.on('data', function(data) {
    var dataHex = data.toString('hex');
    console.log(dataHex);
    if (dataHex.toLowerCase() == config.cmd.toLowerCase()) {
    	var key = randomInt(0, simulateData.length-1);
        sendHex(client, simulateData[key]);
    }
});

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function sendHex(socket, command) {
    command = command.toString().replace(/[\s]*/ig, '');
    if (socket) {
        socket.write(command, 'hex');
    }
}
