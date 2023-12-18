module.exports = class StringHelper {
    static padLeft(s, w, pc) {
        if (pc == undefined) {
            pc = '0'
        }
        for (var i = 0, c = w - s.length; i < c; i++) {
            s = pc + s
        }
        return s
    }
    static padRight(s, w, pc) {
        if (pc == undefined) {
            pc = '0'
        }
        for (var i = 0, c = w - s.length; i < c; i++) {
            s = s + pc
        }
        return s
    }

    static replaceEmptyString(str) {
        return str.replace(/[\s]*/gi, '')
    }

    static byteSplit(str, slice = 2) {
        let items = []
        if (!str) {
            return items
        }
        const len = str.length
        for (let i = 0; i < len; i += slice) {
            let value = str.substr(i, slice)
            items.push(value)
        }

        return items
    }

    static stringToHex(str) {
        let vals = []
        for (var i = 0; i < str.length; i++) {
            vals.push(str.charCodeAt(i).toString(16))
        }
        return vals.join('');
    }
}