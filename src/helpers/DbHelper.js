const mysql = require('mysql')

module.exports = {
    createInsertValues(values) {
        const valuesArray = []
        const transformedValues = this.transformValues(values)

        for (let key in transformedValues) {
            const value = transformedValues[key]
            valuesArray.push(`\`${key}\` = ${value}`)
        }

        return valuesArray.join()
    },
    transformValues(values) {
        const newObj = {}

        for (let key in values) {
            const rawValue = values[key]
            let value = mysql.escape(rawValue)
            newObj[key] = value
        }

        return newObj
    },
    sqlWhere(where) {
        if (!where) return
        if (typeof where === 'string') return where

        const whereArray = []

        for (let key in where) {
            whereArray.push('`' + key + '` = ' + mysql.escape(where[key]))
        }

        return 'WHERE ' + whereArray.join(' AND ')
    },
    generateInsertSql(table, values = {}) {
        return `INSERT INTO \`${table}\` SET ${this.createInsertValues(values)}`
    },
    generateUpdateSql(table, values, where) {
        return `UPDATE \`${table}\` SET ${this.createInsertValues(values)} ${this.sqlWhere(where)}`
    },
    generateDeleteSql(table, where) {
        return `DELETE FROM \`${table}\` ${this.sqlWhere(where)}`;
    }
}