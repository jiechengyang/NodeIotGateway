const MySQLChassis = require('mysql-chassis'),
    Mysql = require('mysql'),
    Util = require('util')
EventEmitter = require('events').EventEmitter

class DbProxy {
    constructor(config, isPool = false, connectionLimit = 10) {
        EventEmitter.call(this)
        this.dbConfig = config
        this.isPool = isPool
        if (this.isPool) {
            this.dbConfig['connectionLimit'] = connectionLimit
        }

        if (!this.isPool) {
            this.db = new MySQLChassis(this.dbConfig)
        } else {
            this.pool = Mysql.createPool(this.dbConfig)
        }
    }

    connect(cb) {
        this.db.connection.connect(cb)
    }

    end() {
        if (this.isPool) {
            return new Promise((resolve, reject) => {
                this.pool.end((error) => {
                    if (error) {
                        reject(error)
                    }
                    resolve('ok')
                })
            })
            // this.pool.end((error) => {
            //     if (error) {
            //         throw error
            //     }
            // })
        } else {
            this.db.connection.end()
        }
    }

    query(sql, cb) {
        this.pool.getConnection((error, connect) => {
            if (error) {
                throw error
            }
            connect.query(sql, (err, rows, fields) => {
                // 释放连接， 回收pool
                connect.release()
                typeof cb === 'function' && cb(err, rows, fields)
            })
        })
    }

    promiseQuery(sql, values) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    reject(err)
                } else {
                    connection.query(sql, values, (err, rows) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(rows)
                        }
                        // 结束会话
                        connection.release()
                    })
                }
            })
        })
    }

    dbQuery(sql, values) {
        return new Promise((resolve, reject) => {
            this.db.connection.query(sql, values, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    // 结束会话
                    this.end()
                    resolve(rows)
                }
            })
        })
    }

    getDb() {
        return this.db
    }

    getDbPool() {
        return this.pool
    }

    onSingleEvents() {
    }
}

Util.inherits(DbProxy, EventEmitter)

module.exports = DbProxy



