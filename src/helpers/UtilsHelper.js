/**
 *  工具类
 *  TODO：后期弃用
 */
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto')
const self = (module.exports = {
  getTimestamp() {
    return new Date().getTime()
  },
  fsExistsSync: (path) => {
    try {
      fs.accessSync(path, fs.F_OK)
    } catch (e) {
      return false
    }

    return true
  },
  isNull: (value) => {
    if (
      value === '' ||
      value === null ||
      value === undefined ||
      value === 'undefined' ||
      typeof value === 'undefined' ||
      value.length === 0
    ) {
      return true
    }
    return false
  },
  isGuest: (session) => {
    if (!session.accessToken) {
      return true
    }
    return false
  },
  inArray: (val, arr) => {
    var flag = false
    for (var i = 0; i < arr.length; i++) {
      if (val === arr[i]) {
        flag = true
        break
      }
    }
    return flag
  },
  loadConfig: () => {
    const localConfigJsonFile =
      path.dirname(__dirname) + '/config/params-local.js'
    if (!self.fsExistsSync(localConfigJsonFile)) {
      const data = new Uint8Array(Buffer.from('{\n}'))
      fs.writeFileSync(localConfigJsonFile, data)
    }

    return require('../config/config')
  },
  log: (msg, type = 'info') => {
    const util = require('util')
    if ('debug' === type) {
      util.debug(msg)
    } else if ('error' === type) {
      console.error(msg)
    } else {
      util.log(msg)
    }
  },
  genRandomString: (length) => {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  },
  saltHashStr: (str, salt) => {
    salt = salt || self.genRandomString(4)
    let data = self.sha256(str, salt)
    return data.strHash
  },
  sha256(str, salt) {
    let hash = crypto.createHmac('sha256', salt)
    /** Hashing algorithm sha512 */
    hash.update(str)
    let value = hash.digest('hex')
    return {
      salt: salt,
      strHash: value,
    }
  },
  sendHexCmd(socket, command, debug = false) {
    command = command.replace(/[\s]*/gi, '').toUpperCase()
    if (debug) {
      console.log(`#*** Current Send Command: ${command} ***#\r\n\r\n`)
    }
    if (socket) {
      socket.write(command, 'hex')
    }
  },
  //将16进制转为 字符串
  hexToString(str) {
    var val = "", len = str.length / 2
    for (var i = 0; i < len; i++) {
      val += String.fromCharCode(parseInt(str.substr(i * 2, 2), 16));
    }
    return this.utf8to16(val);
  },
  //处理中文乱码问题
  utf8to16(str) {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
      c = str.charCodeAt(i++);
      switch (c >> 4) {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
          out += str.charAt(i - 1);
          break;
        case 12: case 13:
          char2 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          char2 = str.charCodeAt(i++);
          char3 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
          break;
      }
    }

    return out;
  }
})
