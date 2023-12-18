const log4js = require('log4js')
const path = require('path')
const log4js_extend = require('log4js-extend')
const UtilsHelper = require('../../helpers/UtilsHelper')
const systemConfig = UtilsHelper.loadConfig()
const SRC_PATH = path.dirname(path.dirname(__dirname))
const logPath = systemConfig.logger.path
/**
 * 日志组件 log4js 配置
 */
log4js.configure({
  pm2: true,
  replaceConsole: true,
  appenders: {
    // 控制台输出
    stdout: { type: 'stdout' },
    // 错误日志
    error: {
      type: 'dateFile',
      filename: logPath + 'error',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      maxLogSize: 1024 * 1024 * 2,
      backups: systemConfig.logger.filecount,
      compress: true,
    },
    // 普通日志
    info: {
      type: 'dateFile',
      filename: logPath + 'info',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      maxLogSize: 1024 * 1024 * 2,
      backups: systemConfig.logger.filecount,
      compress: true,
    },
  },
  categories: {
    // appenders:取appenders项, level:设置级别
    default: { appenders: ['stdout', 'error', 'info'], level: 'debug' },
    error: { appenders: ['stdout', 'error'], level: 'error' },
  },
})

log4js_extend(log4js, {
  path: __dirname,
  format: 'at @name (@file:@line:@column)',
})

/**
 * name 取值categories里的某一键值
 */
exports.getLogger = function (name) {
  return log4js.getLogger(name || 'default')
}
