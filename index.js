require('num2str')
const uid_symbol = Symbol('Uid')
let date = new Date()
let count = 0
let uCount = -1

function uid() {
    return `${random().toString62()}${udate().toString62()}${udatecount().toString62()}`
}

function udate() {
    const now = new Date()
    if (date == now) {
        count++
    } else {
        count = 0
        date = now
    }
    return new Date().getTime()
}

function udatecount() {
    return count
}

function random() {
    return +Math.random().toString().substr(2)
}

function ucount() {
    uCount++
    return uCount
}

function symbol(des = '') {
    const sb = Object.assign(Symbol(des))
    const suid = `${udate().toString62()}${udatecount().toString62()}`
    Object.defineProperties(sb, {
        [uid_symbol]: { value: suid },
        toString: { value: () => des == '' ? `[${suid}]` : `[${des}:${suid}]` }
    })
    return sb
}

function usymbol() {
    const suid = `${udate().toString62()}${udatecount().toString62()}`
    const sb = Object.assign(Symbol(suid))
    Object.defineProperties(sb, {
        [uid_symbol]: { value: suid },
        toString: { value: () => `[${suid}]` }
    })
    return sb
}

class LazyOption {
    constructor() {
        this.chain = []
    }
    val() {
        let now = ''
        this.chain.forEach(fn => {
            now = fn(now)
        })
        return now
    }
    add(fn) {
        this.chain.push(fn)
    }
}

const oper_symbol = Symbol('Uid.Oper')
function makeOper(fn, cb) {
    Object.defineProperties(fn, {
        [oper_symbol]: { value: cb }
    })
    return fn
}
function isOper(fn) {
    return fn[oper_symbol] != null
}
function getOper(fn) {
    return fn[oper_symbol]
}

uid.uid_symbol = uid_symbol
const fns = Object.assign(Object.create(null), {
    random,
    time: udate,
    timecount: udatecount,
    count: ucount,
    symbol: usymbol
})
const opers = Object.assign(Object.create(null), {
    Symbol: makeOper(symbol, (target, opt) => {
        return (str = '') => `${str}${target.toString()}`
    }),
    radix: makeOper((n = 10) => n, (target, opt) => {
        const last = opt.chain.pop()
        if (last == null) return (str = '') => str
        const v = +last()
        if (v == NaN) {
            opt.chain.add(last)
            return (str = '') => str
        }
        return (str = '') => `${str}${v.toStringN(+target)}`
    }),
})

function makeProxy(fn, opt) {
    if (isOper(fn)) {
        return (...p) =>
            makeCustomProxy(fn(...p), opt, getOper(fn))
    } else if (opt == null) {
        return new Proxy(fn, {
            get(target, property) {
                let val = fns[property]
                if (val == null) {
                    val = opers[property]
                }
                if (val == null) {
                    return target[property]
                }
                opt = new LazyOption
                opt.add((str = '') => `${str}${target()}`)
                return makeProxy(val, opt)
            }
        })
    } else {
        return new Proxy(fn, {
            apply(target, thisArg, argumentsList) {
                return `${opt.val()}${target(...argumentsList)}`
            },
            construct(target, argumentsList) {
                opt.add((str = '') => `${str}${target(...argumentsList)}`)
                return {
                    val() {
                        return opt.val()
                    }
                }
            },
            get(target, property) {
                if (property == 'val') {
                    return opt.val()
                }
                const val = fns[property]
                if (val == null) {
                    val = opers[property]
                }
                if (val == null) {
                    return target[property]
                }
                opt.add((str = '') => `${str}${target()}`)
                return makeProxy(val, opt)
            }
        })
    }
}

function makeCustomProxy(v, opt, cb) {
    if (v == null) v = Object.create(null)
    else if (typeof v != 'object') v = Object.assign(v)
    if (opt == null) {
        return new Proxy(v, {
            get(target, property) {
                let val = fns[property]
                if (val == null) {
                    val = opers[property]
                }
                if (val == null) {
                    return target[property]
                }
                opt = new LazyOption
                opt.add(cb(target, opt))
                return makeProxy(val, opt)
            }
        })
    } else {
        return new Proxy(v, {
            get(target, property) {
                if (property == 'val') {
                    const lastfn = cb(target, opt)
                    return `${opt.val()}${lastfn()}`
                }
                let val = fns[property]
                if (val == null) {
                    val = opers[property]
                }
                if (val == null) {
                    return target[property]
                }
                opt.add(cb(target, opt))
                return makeProxy(val, opt)
            }
        })
    }
}

module.exports = Object.assign(uid, {
    random: makeProxy(random),
    time: makeProxy(udate),
    timecount: makeProxy(udatecount),
    count: makeProxy(ucount),
    symbol: makeProxy(usymbol),
    //Oper
    Symbol: makeProxy(symbol),
})