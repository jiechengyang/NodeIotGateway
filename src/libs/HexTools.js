module.exports = class HexTools {
    /**
     * 将16进制字符串转为十进制数字
     * 如  HexTools.hex2Number('0x11') //17
     *     HexTools.hex2Number('21') //33
     *     HexTools.hex2Number('0xffff') //65535
     *     HexTools.hex2Number('ffff') //65535
     * @param str 可传入16进制的8位或16位字符串
     * @returns {number}
     */
    static hex2Number(str = '') {
        if (str.indexOf('0x') === 0) {
            str = str.slice(2);
        }
        return parseInt(`0x${str}`, 16);
    }

    /**
     * 将16进制字符串转为指定字节的字符串
     * @param {string} 十六进制字符串
     * @param {byteLen} 字节大小  
     * @return {string}
     */
    static hex2ByteString(str = '', byteLen = 2) {
        if (str.indexOf('0x') === 0) {
            str = str.slice(2);
        }
        let len = str.length;
        let total = byteLen * 2 - len;

        if (total > 0) {
            while (total) {
                str = '0' + str;
                total--;
            }
        }
        return str;
    }

    /**
     * 十进制数字转为指定字节的16进制字符串
     * @param num
     * @param {byteLen} 字节大小
     * @returns {string} 得到n字节的16进制字符串
     */
    static num2HexBytes(num = 0, byteLen = 1) {
        const str = num.toString(16);
        return HexTools.hex2ByteString(str, byteLen);
    }

    /**
     * 十进制数字(这里最大为255)转为8位16进制字符串
     * @param num
     * @returns {string} 得到8位的16进制字符串
     */
    static num2Hex(num = 0) {
            return ('00' + num.toString(16)).slice(-2);
    }

    /**
     * hex数组转为num
     * 数组中每一元素都代表一个8位字节，16进制的数字
     * 比如：一个精确到毫秒位的时间戳数组为[ 1, 110, 254, 149, 130, 160 ]，可以用这个函数来处理，得到十进制的时间戳1576229241504
     * 比如：一个精确到秒位的时间戳数组为[ 93, 243, 89, 121 ]，可以用这个函数来处理，得到十进制的时间戳1576229241
     * @param array 按高位在前，低位在后来排列的数组，数组中每一元素都代表一个8位字节，16进制的数字
     * @return {Number}
     */
    static hexArrayToNum(array) {
        let count = 0, divideNum = array.length - 1;
        array.forEach((item, index) => count += item << (divideNum - index) * 8);
        return count;
    }

    /**
     * num转为hex数组
     * 与{hexArrayToNum}含义相反
     * @param num
     * @returns {*} 一个字节代表8位
     */
    static num2HexArray(num) {
        if (num === void 0) {
            return [];
        }
        num = parseInt(num);
        if (num === 0) {
            return [0];
        }	
        let str = num.toString(16);
        str.length % 2 && (str = '0' + str);
        const array = [];
        for (let i = 0, len = str.length; i < len; i += 2) {
            array.push(`0x${str.substr(i, 2)}`);
        }
        return array;
    }

    /**
     * 获取数据的低八位
     * @param data
     * @returns {{lowLength: number, others: Array}}
     */
    static getDataLowLength({data}) {
        // const dataPart = [];
        // data.map(item => HexTools.num2HexArray(item)).forEach(item => dataPart.push(...item));
        // const lowLength = HexTools.hex2Num((dataPart.length + 1).toString(16));
        // return {lowLength, others: dataPart};
    }

    /**
     * ArrayBuffer转16进制字符串
     * @param {Object} buffer
     * @returns {string} hex
     */
    static arrayBuffer2hex(buffer) {
      const hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
          return ('00' + bit.toString(16)).slice(-2);
        }
      )
      return hexArr.join('');
    }

    /**
     * ArrayBuffer转16进制字符串数组
     * @param {Object} buffer
     * @returns {Array} hexArr
     */
    static arrayBuffer2hexArray(buffer) {
      const hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
          return ('00' + bit.toString(16)).slice(-2);
        }
      )
      return hexArr;
    }

    /**
     * 16进制字符串转ArrayBuffer(默认两个字节，小端序)
     * @param {Object} dataview
     * @param {string} hex 16进制字符串
     * @param {number} offset	偏移量
     * @param {number} bytes	几个字节
     * @returns {Object} dataview
     */	
    static hex2ArrayBuffer(dataview, hex, offset, bytes = 2) {
        var num = HexTools.hex2Number(hex);
        switch(bytes) {
            case 1:
                dataview.setUint8(offset, num);
                break;
            case 2:
                dataview.setUint16(offset, num, true);
                break;
            case 4:
                dataview.setUint32(offset, num, true);
                break;
            default:
        }
        return dataview;
    }

    /**
     * number 转 小端序 ArrayBuffer (默认两个字节)
     * @param {Object} dataview 
     * @param {string} num		数字
     * @param {number} offset	偏移量
     * @param {number} bytes	几个字节
     * @returns {Object} dataview
     */	
    static num2ArrayBuffer(dataview, num, offset, bytes = 2) {
        switch(bytes) {
            case 1:
                dataview.setUint8(offset, num);
                break;
            case 2:
                dataview.setUint16(offset, num, true);
                break;
            case 4:
                dataview.setUint32(offset, num, true);
                break;
            default:
        }
        return dataview;
    }

    /**
     * 小端序 ArrayBuffer 获取number (默认两个字节)
     * @param {Object} dataview 
     * @param {number} offset	偏移量
     * @param {number} bytes	几个字节
     * @returns {number} count
     */	
    static arrayBuffer2number(dataview, offset, bytes = 2) {
        let count = 0;
        switch(bytes) {
            case 1:
                count = dataview.getUint8(offset, true);
                break;
            case 2:
                count = dataview.getUint16(offset, true);
                break;
            case 4:
                count = dataview.getUint32(offset, true);
                break;
            default:
        }
        return count;
    }

    /**
     * arraybuffer（ASCLL码） 转为字符型字符串（非16进制）
     * 1个字节一个字符 Uint8
     * @param {Object} buffer
     * @return {String} 字符串
     */
    static arraybuffer2String(buffer) {
      return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }

    /**
     * string 转为 arraybuffer ASCLL码
     * @param {String} str
     * @return {Object} arraybuffer
     */
    static string2Arraybuffer(str) {
      const buf = new ArrayBuffer(str.length); // 1 bytes for each char
      const bufView = new Uint8Array(buf);
      for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }
}