// 0d2424008038303230323330303130353100000000000000000000000000000000aa0d0a
//[0d 24 24 00 80  31 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 aa 0d 0a] 
// 帧长度、功能码、Data异或(即：帧长度^功能码^Data)
const crc16 = require('../libs/CRC16')
const stringHelper = require('../helpers/StringHelper')
const str = '80202300105100'
// console.log(crc16.ToModbusCRC16('24008038303230323330303130353100000000000000000000000000000000'))
// 0D 24 1D 00 80 15 07 16 15 2A 2A 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 8D 0D 0A
// 1d: 29
// 80:128
// 15 07 16 15 2A 2A
// 01
//00 00 00 00 00 00 00 00 00 00 00 00 00 00
const items ='38303230323330303130353100000000000000000000000000000000'.split(/(\d{2})/).filter(Boolean)
console.log(0x24 ^ 0x00 ^ 0x80 ^ 0x38 ^ 0x30 ^ 0x32 ^ 0x30 ^ 0x32 ^ 0x33 ^ 0x30 ^ 0x30 ^ 0x31 ^0x30 ^ 0x35 ^ 0x31)
//0D 24 08 00 82 8A 0D 0A
console.log(0x08 ^ 0x00 ^ 0x8a)


// 0D 24 3A 00 80 17 30 E0 E0 1E 31 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 B3 0D 0A 
// 0D 24 1D 00 80 15 07 16 15 2A 2A 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 8D 0D 0A

// 0D 24 08 00 82 8A 0D 0A
// 0D 24 08 00 82 8A 0D 0A

// 出货：0D 24 20 0073 0A 003136373939313531353934383132 0000000000000000 5F 0D0A


// 013136373939313636313838383837
// 013136373939313636313838383837
// 回复出货：0d24170073013136373939313636313838383837620d0a

const str2 = '0d24170073013136373939313636313838383837620d0a'
const order_no_hex = '013136373939323033353832393633' 
//str2.substr(10, 30)
const codes = stringHelper.byteSplit(order_no_hex, 2)
console.log('order_no_hex:', order_no_hex, codes)
let order = ''
codes.map(code => {
    // console.log(eval(`0x${code}`).toString(16))
    let num = parseInt(`0x${code}`, 16)
    console.log(String.fromCharCode(num))
    order += String.fromCharCode(num)
})

console.log('order:', order)