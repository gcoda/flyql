const fetcher = require('../../../lib/fetcher/fetcher')
const makeCacheKey = require('../../../fetch-worker/makeCacheKey')
const { createHash } = require('crypto')

const DataLoader = require('dataloader')

class HttpSource {
  // context = {}
  // dataLoader = () => {}
  initialize(config) {
    this.context = config.context
  }
  constructor({ remoteFetcherUrl, fetch }) {
    if (typeof fetch !== 'function') {
      throw new Error('Must provide fetch function')
    }
    if (remoteFetcherUrl) {
      this.dataLoader = new DataLoader(
        keys =>
          fetch(remoteFetcherUrl, {
            method: 'POST',
            body: JSON.stringify(keys),
            headers: {
              'content-type': 'application/json',
            },
          }).then(results => {
            // const type = results.headers.get('content-type')
            if (results.status !== 200) {
              throw new Error('BAD FETCHER REESPONSE: ' + results.status)
            } else {
              return results.json()
            }
          }),
        { cacheKeyFn: object => object.cacheKey }
      )
    } else {
      this.dataLoader = new DataLoader(
        keys => Promise.all(keys.map(fetcher(fetch))),
        { cacheKeyFn: object => object.cacheKey }
      )
    }
  }
  async load(options) {
    if (!options.url) return {}
    options.cacheKey = makeCacheKey(options)
    options.maxAge = options.maxAge || 300
    return this.dataLoader.load(options).then(result => {
      if (result.response) {
        return result.response
      } else {
        this.dataLoader.clear(options)
      }
    })
  }
}
module.exports = HttpSource
