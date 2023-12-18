let CRC = {
    CRC16(data) {
        let len = data.length
        if (len > 0) {
            var crc = 0xFFFF

            for (var i = 0; i < len; i++) {
                crc = (crc ^ (data[i]))
                for (var j = 0; j < 8; j++) {
                    crc = (crc & 1) != 0 ? ((crc >> 1) ^ 0xA001) : (crc >> 1)
                }
            }
            var hi = ((crc & 0xFF00) >> 8)  //高位置
            var lo = (crc & 0x00FF);        //低位置

            return [hi, lo]
        }
        return [0, 0]
    },
    CRCXMODEM(bytes) {
        var crc = 0x00;
        var polynomial = 0x1021;
        for (var index = 0 ; index < bytes.length; index++) {
            var b = bytes[index];
            for (var i = 0; i < 8; i++) {
                var bit = ((b   >> (7-i) & 1) == 1)
                var c15 = ((crc >> 15    & 1) == 1)
                crc <<= 1

                console.log('crc:', crc)
                if (c15 ^ bit) crc ^= polynomial
            }
        }
        crc &= 0xffff
        var hi = ((crc & 0xFF00) >> 8)  //高位置
        var lo = (crc & 0x00FF);        //低位置

        return [hi, lo]
    },
    isArray(arr) {
        Object.prototype.toString.call(arr) === '[object Array]'
    },
    ToCRC16(str, isReverse) {
        return CRC.toString(CRC.CRC16(CRC.isArray(str) ? str : CRC.strToByte(str)), isReverse)
    },
    ToXMODEM(str, isReverse) {
        return CRC.toString(CRC.CRCXMODEM(CRC.strToHex(str)), isReverse)
    },
    ToModbusCRC16(str, isReverse) {
        return CRC.toString(CRC.CRC16(CRC.isArray(str) ? str : CRC.strToHex(str)), isReverse)
    },
    checkModbusCRC16(str) {
        return str.slice(-4).toUpperCase() == CRC.ToModbusCRC16(str.slice(0, -4)).toUpperCase()
    },
    strToByte(str) {
        var tmp = str.split(''), arr = []
        for (var i = 0, c = tmp.length; i < c; i++) {
            var j = encodeURI(tmp[i])
            if (j.length == 1) {
                arr.push(j.charCodeAt())
            } else {
                var b = j.split('%');
                for (var m = 1; m < b.length; m++) {
                    arr.push(parseInt('0x' + b[m]))
                }
            }
        }
        return arr
    },
    convertChinese(str) {
        var tmp = str.split(''), arr = []
        for (var i = 0, c = tmp.length; i < c; i++) {
            var s = tmp[i].charCodeAt()
            if (s <= 0 || s >= 127) {
                arr.push(s.toString(16))
            } else {
                arr.push(tmp[i])
            }
        }
        return arr
    },
    filterChinese(str) {
        var tmp = str.split(''), arr = []
        for (var i = 0, c = tmp.length; i < c; i++) {
            var s = tmp[i].charCodeAt()
            if (s > 0 && s < 127) {
                arr.push(tmp[i])
            }
        }
        return arr
    },
    strToHex(hex, isFilterChinese) {
        hex = isFilterChinese ? CRC.filterChinese(hex).join('') : CRC.convertChinese(hex).join('')
        //清除所有空格
        hex = hex.replace(/\s/g, "")
        //若字符个数为奇数，补一个0
        hex += hex.length % 2 != 0 ? "0" : ""

        var c = hex.length / 2, arr = [];
        for (var i = 0; i < c; i++) {
            arr.push(parseInt(hex.substr(i * 2, 2), 16))
        }
        return arr
    },
    padLeft(s, w, pc) {
        if (pc == undefined) {
            pc = '0'
        }
        for (var i = 0, c = w - s.length; i < c; i++) {
            s = pc + s
        }
        return s
    },
    toString(arr, isReverse) {
        if (typeof isReverse == 'undefined') {
            isReverse = true
        }
        var hi = arr[0], lo = arr[1]
        return CRC.padLeft((isReverse ? hi + lo * 0x100 : hi * 0x100 + lo).toString(16).toUpperCase(), 4, '0')
    }
}

module.exports = CRC