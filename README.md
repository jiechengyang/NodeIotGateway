node-iot-gateway


# 简介
  基于nodejs开发的TCP通用物联网设备网关程序，目前已集成支持多种Modbus协议的设备；设备包含：多种类型的传感器(新普惠)、娃娃机终端等

# 核心代码业务分析
## 功能和用途

- TCP服务器实现：通过 CollectionServer 类来创建和管理TCP服务器，处理客户端连接和数据通信。
-  客户端通信处理：BoxCollectionClient 和 BaseCollectionClient 类处理与盒子设备和其他客户端的通信，包括数据解析、处理、转发等功能。
- 心跳检测：HeartBeat 类提供了心跳检测功能，定期检查客户端连接状态，确保连接正常。
- 字符串处理工具：StringHelper 类提供了一系列字符串处理的静态方法，包括填充、分割、转换等操作

## 优点
- 模块化和结构清晰：对象映射可以使代码更加清晰和可扩展，代码分割成多个类和功能模块，使得代码结构清晰，易于维护和扩展。
- 功能完善：实现了TCP服务器、客户端通信、心跳检测等核心功能，涵盖了常见的网络通信需求。
- 静态方法封装：使用静态方法封装通用的功能，提高了代码的复用性和可维护性。

## 缺点：

- 错误处理不足：代码中的错误处理可能不够严谨，例如在一些地方出现了直接的 try-catch 语句，并没有详细处理错误情况。
- 潜在的资源泄漏：部分地方未能完全释放资源，例如关闭连接时可能存在一些资源未被正确释放的情况。

# 部署

- 安装npm包

```shell
npm install
// or use yarn
```
- 调试运行
```
node src/box_iot_server.js
```
- 全局安装pm2进程管理工具

```shell
npm install -g pm2
// or use yarn
```

- 编写进程管理配置文件

```shell
cp econsytem.config.js.example econsytem.config.js
```

更多配置参考 [econsytem.config.js.example](./econsytem.config.js.example)

- 自定义配置服务参数
```shell
  vim src/config/params-local.js
```
  主要的参数有下面的：
  ```js
module.exports = {
   // TODO： 下一个版本将不再对业务数据支持
    mysql: {
        database: '{{db_name}}',
        user: '{{db_user}}',
        password: '{{db_password}}',
        host: '{{db_host}}',
        port: 3306
        //sqlPath: path.join(process.cwd(), './sql')
    },
    frequency: 1000 * 60 * 1,
    port: 16009,//网关端口号
}
```

- 启动服务

```shell
pm2 start econsytem.config.js
```

- 查看服务

```shell
pm2 list
```
```shell
pm2 show 
```

- 监听日志

```shell
pm2 log 
```


更多参考，[pm2官方](https://pm2.keymetrics.io/)


# 正在开发中

## 通用网关方案
  努力集成更多的设备，适配更多的通信协议；打造易扩展的通用网关（取消连接数据库，与业务解偶）

### 具体流程
#### 转发对象配置：
 - 超级管理员端： 通过配置一个超级管理员端，它可以接收来自所有连接的 collectSockets 的数据。这样的设计可以用于全局的数据监控、统计或处理。网关数据持久化：配置本地接入应用方，将数据转发到本地

 - 具体业务端： 应用方管理：根据设备的ID字符串格式找到对应的转发对象。这样，你可以根据业务需要将数据转发给特定的处理程序。这种映射关系可以通过配置文件或数据库进行管理，使得你可以动态地调整转发规则。

### 转发：
  配置应用接入放对接模式，支持：mqtt 消息对接 和 web hock方式；
  mqtt: 将网关拿到的设备数据分业务场景转发到应用方的消息服务器
  使用 Webhook 进行数据转发是一个不错的选择，因为它简单、轻量，适用于实时的数据推送。确保 Webhook 的端点能够接收和处理你需要转发的数据，并提供足够的安全措施（例如身份验证、加密等）。
 - 模块化设计： 将数据收发和转发的逻辑模块化，这样可以更容易理解和维护。每个模块负责特定的功能，例如数据收发、转发逻辑等。
 - 动态配置： 通过配置文件或其他方式，实现动态调整转发规则。这对于在运行时修改转发规则或添加新设备类型非常有用。
 - 错误处理： 考虑添加适当的错误处理机制，确保即使在转发过程中出现问题，系统也能够优雅地处理，而不至于影响整体功能。
 - 性能优化： 当设备数量暴增时，性能可能成为一个问题。确保转发系统能够处理大量并发连接，并进行性能测试以识别潜在的瓶颈。

## 实现多种模拟厂商设备通信协议客户端

## 提供模拟设备程序，打造网关与设备的通信测试环境
   ### tcp modbus 模型
   1. [MAC Book Pro 使用 libmodbus](https://blog.csdn.net/justidle/article/details/119914316)
   2. [搭建MQTT服务器（Docker版）](https://www.cnblogs.com/yourstars/p/15247707.html)
   3. [选择适合您的平台，立即开始使用 MQTTX](https://mqttx.app/zh/downloads)
   4. [下载 EMQX](https://www.emqx.io/zh/downloads)
   5. [MAC 下配置MQTT 服务器Mosquitto](https://www.jianshu.com/p/7da36385243c)
   6. [A pure JavaScript implementation of MODBUS-RTU (Serial and TCP) for NodeJS.](https://github.com/yaacov/node-modbus-serial/wiki)
   7. [Access serial ports with JavaScript. Linux, OSX and Windows. Welcome your robotic JavaScript overlords. Better yet, program them!](https://github.com/serialport/node-serialport)
   8. [使用 Web Serial API 在浏览器上实现基于 WEB 的串口通信](https://blog.csdn.net/weixin_41231535/article/details/115218293)