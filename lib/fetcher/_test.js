const fetch = require('node-fetch')
const fetcher = require('./fetcher')(fetch)

fetcher({
  url: 'http://u4341.violet.elastictech.org',
  // response: 'BLOB',
}).then(res => console.dir(res, { depth: 8 }))
