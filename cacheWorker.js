const cache = caches.default
const makeKey = (key, prefix = 'default') =>
  new Request(
    `https://from-gist.scheme.workers.dev/cache.${prefix}.${key}.json`,
    { method: 'GET' }
  )
module.exports = prefix => ({
  async put(key, value, { ttl = 300 } = { ttl: 300 }) {
    const response = new Response(JSON.stringify(value), {
      status: 200,
    })
    const maxAge = ttl < 1 ? 0 : ttl > 86400 ? 86400 : ttl | 0
    response.headers.set('Content-type', 'application/json')
    response.headers.set('Cache-Control', `max-age=${maxAge}`)
    return maxAge && cache.put(makeKey(key, prefix), response)
  },
  get(key) {
    return cache
      .match(makeKey(key, prefix))
      .then(res => res.json())
      .catch(() => null)
  },
})
