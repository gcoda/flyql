
const { createHash } = require('crypto')
const ignoreFetchKeys = ['maxAge', 'response', 'ignoreErrors', 'req']
const makeCacheKey = obj => {
  const string = JSON.stringify(
    Object.entries(obj)
      .filter(([key]) => !ignoreFetchKeys.includes(key))
      .sort(([a], [b]) => (a > b ? -1 : 1))
  )
  return obj.cacheKey
    ? obj.cacheKey
    : createHash('sha256')
        .update(string)
        .digest('hex')
}
module.exports = makeCacheKey