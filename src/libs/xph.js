module.exports = {
	checkData : function (data) {
		console.log('数据长度:', data.length);
		console.log('计算得到的数据长度:', (this.getChannelByteCount(data) + 6) * 2);
		return data.length === (this.getChannelByteCount(data) + 6) * 2;
	},

	/**
	 * 获取通道数据段字节数
	 * @return {int} 
	 */
	getChannelByteCount : function (data) {
		// console.log('数据长度域:', data.substr(4, 4));
		// console.log('通道数据段字节数:', parseInt(data.substr(4, 4), '16'));
		// console.log(data.substr(4, 4), parseInt(data.substr(4, 4), '16'));
		return parseInt(data.substr(4, 4), '16');
	},

	/**
	 * 取通道个数
	 * @return {int} 
	 */
	getChannelCount : function (data) {
		return this.getChannelByteCount(data) / 2;
	},

	/**
	 * 取全部通道原始数据
	 * @return {hex string} 
	 */
	getChannelHexDataAll : function (data) {
		return data.substr(8, this.getChannelByteCount(data) * 2);
	},

	/**
	 * 解析单个通道数据
	 * @author atuxe
	 * @param  {hex} hexData 通道数据; 例: FF3D
	 * @return {float}       十进制数值
	 */
	parseSingleHexData : function (hexData) {
		hexData = hexData.replace(/\s*/g, '');
		if (hexData.length !== 4) {
			return 0;
		}
		return this.parseSignedHex2Dec(hexData);
	},

	/**
	 * 将4位有符号十六进制数转为十进制数
	 * @param  {hex string} hexData 4位有符号十六进制数
	 * @return {float}      
	 */
	parseSignedHex2Dec : function (hexData) {
		var a = parseInt(hexData, 16);
		if ((a & 0x8000) > 0) {
		   a = a - 0x10000;
		}
		return a;
	},

	/**
	 * 解析全部通道数据
	 * @return {Object} 
	 */
	parseAllHexData : function (data) {
		var self = this;
		var allHexData = self.getChannelHexDataAll(data),
			result = {},
			hexDataArray = [],
			channelCount = self.getChannelCount(data);
		
		for (var i = 0; i < channelCount; i++) {
			hexDataArray.push(allHexData.substr(i * 4, 4));
		}
		hexDataArray.forEach(function (val, index) {
			index ++;
			index = index > 9 ? index.toString() : '0' + index.toString();
			result['channel_' + index] = val.toUpperCase() === '7FFF' ? null : self.parseSingleHexData(val);
		});

		return result;
	}
}