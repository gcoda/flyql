const camelCase = require('lodash/camelCase')
const cookieParser = require('set-cookie-parser')
module.exports = fetch => options => {
  if (!options.url) {
    return Promise.reject('must provide url')
  }
  return fetch(options.url, { timeout: 10 * 1000, ...options })
    .then(async result => {
      const headersArray = Array.from(result.headers.entries())
      const headers = headersArray.reduce((all, [name, value]) => {
        const camelName = camelCase(name)
        return {
          ...all,
          [camelName]: value,
        }
      }, {})
      const cookies = headers.setCookie
        ? cookieParser.parse(
            cookieParser.splitCookiesString(headers.setCookie),
            {
              decodeValues: true,
              map: true,
            }
          )
        : {}
      let body = null
      let type = result.headers.get('content-type')
      /**/ if (options.response === 'JSON') {
        body = await result.json()
      } else if (options.response === 'TEXT') {
        body = await result.text()
      } else if (options.response === 'BLOB') {
        const data = await result.blob()
        type = data.type
        body = Buffer.from(await data.arrayBuffer()).toString(
          'base64'
        )
      } else if (options.response === 'BUFFER') {
        const data = await result.buffer()
        body = Buffer.from(data).toString('base64')
      } else body = await result.text()
      return {
        cacheKey: options.cacheKey,
        options,
        response: {
          body,
          type,
          fetchedAt: Date.now(),
          headers,
          // headersArray,
          cookies,
        },
      }
    })
    .catch(error => ({
      error: error.message,
    }))
}
