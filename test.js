const uid = require('./index')

// console.log(uid())

// console.log(uid.random())

// console.log(uid.random.time())

// console.log(uid.symbol())

// console.log(uid.Symbol().count())

console.log(uid.random.radix(62).val)

debugger