let Service = require('node-windows').Service;

let config = [
	{  
		name: 'node_yx_xph',
		description: '新普惠环境采集', 
		script: '/path/xph_server.js'
	}
];

for (var key in config) {
	let svc = new Service(config[key]);
	svc.on('install', () => {  
		svc.start();  
	});  

	svc.install();
}