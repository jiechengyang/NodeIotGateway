var simulateData = require('../libs/xph_data');
var net = require('net');
var util = require('util');

var config = {
    host: '127.0.0.1',
    port: 8899,
    cmd: '01030000F1D8'
};

var server = net.createServer(function connectionListener(socket) {
    console.log('Client come in: ' + socket.remoteAddress +':'+ socket.remotePort);
    socket.on('data', function (data) {
        var hexData = data.toString('hex');
        var utf8Data = data.toString('utf8');
        if (hexData.toLowerCase() == config.cmd.toLowerCase()) {
            var key = randomInt(0, simulateData.length-1);
            sendHex(socket, simulateData[key]);
        } else {
            util.log('Invalid Data:' + hexData);
        }
    });

    socket.on('end', function() {
        util.log('one client end');
    });

    socket.on('close', function(had_error) {
        if (had_error) {

        }
        util.log('one client close');
    });

    socket.on('error', function (ex) {
        console.error('error', ex);
    });
});

server.listen(config.port, config.host);
util.log('Xinpuhui Simulator Server is listening on ' + config.host + ':' + config.port);

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function sendHex(socket, command) {
    command = command.toString().replace(/[\s]*/ig, '');
    if (socket) {
        socket.write(command, 'hex');
    }
}
