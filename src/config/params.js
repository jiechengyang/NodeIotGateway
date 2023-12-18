module.exports = {
  mysql: {
    database: 'byt_xuyong_new_iot',
    user: 'root',
    password: 'root',
    host: 'localhost',
    port: 3306,
    //sqlPath: path.join(process.cwd(), './sql')
  },
  apps: {
    'jcyapp001': {
      mode: 'web_hock',
      addr: null,
      hocks: {
        device_register: 'http://localhost:3123/iot/hock/device_register',
        device_status_switch: 'http://localhost:3123/iot/hock/device_status_switch',
        device_data_pull: 'http://localhost:3123/iot/hock/device_data_pull'
      }
    },
    'jcyapp002': {
      mode: 'mqtt',
      addr: 'mqtt:127.0.0.1:3311',
      hocks: null
    }
  },
  frequency: 1000 * 60 * 60,
  port: 25050,
  host: '0.0.0.0',
  logger: {
    filecount: 5, // 日志文件保存数量
    path: 'runtime/logs/', // GB日志默认存储位置，注意ZLMediaKit的日志位置不是在这里设置的
  },
  heartTime: 1000 * 60 * 5, // 心跳检测时间
}
