const { Response } = require('node-fetch')
const fetch = require('node-fetch')
const Retry = require('../lib/fetcher/retry')
const Fetcher = require('../lib/fetcher/fetcher')
const { renderOps, renderStrings } = require('../lib/template')
const fetchRetry = Retry(fetch)
const fetcher = Fetcher(fetchRetry)
const Cache = require('../cache')
const cache = Cache('fetch-worker')
const makeCacheKey = require('./makeCacheKey')
const validateContext = context =>
  typeof context == 'object' && !Array.isArray(context)
    ? true
    : undefined
module.exports = handleRequest
async function handleRequest(event) {
  const request = event.request
  let reqBody = []
  try {
    if (request.method === 'POST') {
      reqBody = await request.json()
    }
  } catch (e) {
    console.log({ e })
  }
  const isArray = Array.isArray(reqBody)
  const fetchList = isArray ? reqBody : [reqBody]
  const results = await Promise.all(
    fetchList
      .map(options => {
        if (options.cacheKey) return options
        else return { ...options, cacheKey: makeCacheKey(options) }
      })
      .map(async options => {
        const fromCache = await cache.get(options.cacheKey)
        if (fromCache) {
          return fromCache
        } else {
          const fetched = await fetcher(options).catch(error => ({
            error: error.message,
          }))
          let result = fetched
          if (options.response === 'XML') {
            fetched.response.body = renderOps(
              { _xml: { _: ['body'] } },
              { body: fetched.response.body }
            )
          }
          if (options.response === 'MARKDOWN') {
            fetched.response.body = renderOps(
              { _markdown: [{ _: ['body'] }, 'html'] },
              { body: fetched.response.body }
            )
          }
          if (fetched.response && options.template) {
            const context = {
              res: fetched.response,
              ...validateContext(options.context),
            }
            const response = options.template
              ? renderOps(options.template, context)
              : fetched.response

            result = {
              ...fetched,
              response,
            }
          }
          if (options.maxAge) {
            event.waitUntil(
              cache.put(options.cacheKey, result, {
                ttl: options.maxAge,
              })
            )
          }
          return result
        }
      })
  )

  const response = new Response(
    JSON.stringify(isArray ? results : results[0]),
    {
      status: 200,
    }
  )
  response.headers.set('content-type', 'application/json')
  return response
}
