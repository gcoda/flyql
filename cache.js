const LRU = require('lru-cache')
const options = {
  max: 512 * 1000,
  length: (value, key) => {
    const len = JSON.stringify(value).length
    console.log({ len, key })
    return len
  },
  maxAge: 1000 * 60 * 60,
}
const cache = new LRU(options)

module.exports = prefix => ({
  async get(key) {
    console.log('get', { prefix, key })
    return cache.get(prefix + key)
  },
  async put(key, value, { ttl = 300 } = {}) {
    const maxAge = ttl * 1000
    console.log('put', { maxAge, prefix, key })
    cache.set(prefix + key, value, maxAge)
    return { put: { prefix, key } }
  },
})
