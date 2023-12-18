const UtilsHelper = require('../helpers/UtilsHelper')
class HeartBeat {
    static timer = null
    static detection(workers, heartTime) {
        const timeNow = UtilsHelper.getTimestamp();
        for (let key in workers) {
            let socket = workers[key];
            if (typeof socket !== 'object' || UtilsHelper.isNull(socket) || socket.isCheckHeart === false) {
                continue;
            }
            // 有可能该connection还没收到过消息，则lastMessageTime设置为当前时间
            if (!socket.hasOwnProperty('lastMessageTime') || UtilsHelper.isNull(socket.lastMessageTime)) {
                socket.lastMessageTime = timeNow;
                continue;
            }

            // console.log('socket.lastMessageTime:%s,timeNow:%s', socket.lastMessageTime, timeNow);

            // 上次通讯时间间隔大于心跳间隔，则认为客户端已经下线，关闭连接
            if (timeNow - socket.lastMessageTime > heartTime) {
                // socket.write('client connection timeout');
                socket.pause();// 暂停读写数据
                socket.end();// 半关闭 socket
                socket.destroy();
                workers[key] = null;
                // delete workers[key];
            }
        }
    }

    static detectionLater(workers, heartTime) {
        this.clearInterval()
        // this.detection(workers, heartTime)
        // this.timer = setInterval(this.detection, 1000, workers, heartTime);
        //使用 clearInterval() 方法清除定时器，但这种清除方法可能并不完全有效。如果在定时器内部有对外部对象的引用，
        //定时器并不会立即停止，这可能导致一些对象无法被垃圾回收，造成了资源泄漏。
        // 在优化的代码中，我尽量避免直接将对象设为 null，而
        //是使用 delete 操作符从对象中删除对应的属性或键，确保及时释放引用。
        //对于定时器的清理，将函数绑定到 setInterval 中，确保在清除时不会有未被释放的对象。
        const boundDetection = this.detection.bind(this, workers, heartTime)
        this.timer = setInterval(boundDetection, 1000)
    }

    static clearInterval() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

module.exports = HeartBeat