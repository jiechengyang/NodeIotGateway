const DbHelper = require('../helpers/DbHelper')
const log4js = require('../libs/logger/log')
const logger = log4js.getLogger('default')
const DbProxy = require('../libs/DbProxy')

/**
 * TODO：增加mqtt对接、web hock对接
 */
module.exports = class BizBox {
    constructor(dbPool) {
        this.dbPool = dbPool
    }
    registerMachine(macId, clientId, isOnline) {
        let machine = {
            id: null,
            mac_id: macId,
            name: null,
            model_id: 2,
            owner: 1,
            add_user: 1,
            room: null,
            normal: 1,
            client_id: clientId,
            is_online: isOnline
        }
    }

    async updateMachine(macId, clientId, isOnline) {
        if (!macId) {
            return
        }
        let machine = {
            client_id: clientId,
            is_online: isOnline
        }
        let where = {
            mac_id: macId
        }
        try {
            let sql = DbHelper.generateUpdateSql('yk_machine', machine, where)
            const results = await this.dbPool.promiseQuery(sql)
            if (results.affectedRows > 0) {
                logger.info('[业务] 更新设备信息成功：', {
                    sql: sql,
                })
            } else {
                logger.error('[业务] 更新设备信息失败：', {
                    sql: sql
                })
            }
        } catch (e) {
            logger.error('[业务] 更新设备信息失败:', e.message)
        }
    }

    async updateMachineWithCloseServer(dbOptions, macId, clientId)
    {
        if (!macId) {
            return
        }
        const db = new DbProxy(dbOptions, false)
        let machine = {
            client_id: clientId,
            is_online: 2
        }
        let where = {
            mac_id: macId
        }
        let sql = DbHelper.generateUpdateSql('yk_machine', machine, where)
        await db.dbQuery(sql)
    }

    async updateOrder(order, status) {
        if (!order) {
            return
        }
        let data = {
            status: status
        }
        let where = {
            trade_no: order
        }
        try {
            let sql = DbHelper.generateUpdateSql('yk_order', data, where)
            const results = await this.dbPool.promiseQuery(sql)
            if (results.affectedRows > 0) {
                logger.info('[业务] 更新订单投币状态成功：', {
                    order: order,
                    sql: sql,
                })
            } else {
                logger.error('[业务] 更新订单投币状态失败：', {
                    order: order,
                    sql: sql
                })
            }
        } catch (e) {
            logger.error('[业务] 更新订单投币状态失败:', e.message)
        }
    }   
}