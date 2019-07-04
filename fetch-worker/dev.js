const { Request } = require('node-fetch')
const app = require('express')()
const bodyParser = require('body-parser')
app.use(bodyParser.json())

const responseHandler = require('./responseHandler')
app.post('*', (req, res) => {
  responseHandler({
    waitUntil: promiseLike => promiseLike.then(console.log),
    request: new Request('http://worker.worker.dev', {
      method: 'POST',
      body: JSON.stringify(req.body),
    }),
  }).then(async result => {
    const body = await result.json()
    res.set('content-type', 'application/json')
    res.send(JSON.stringify(body, null, 2))
  })
})
app.get('*', (req, res) => {
  responseHandler({
    waitUntil: promiseLike => promiseLike.then(console.log),
    request: new Request('http://worker.worker.dev', {
      method: 'POST',
      body: JSON.stringify([
        {
          url: 'https://httpbin.org/get?query=some',
          method: 'GET',
          response: 'JSON',
        },
        {
          url: 'https://httpbin.org/get?query=some',
          method: 'GET',
          response: 'JSON',
          template: { _: ['res', 'body', 'args'] },
        },
      ]),
    }),
  }).then(async result => {
    const body = await result.json()
    res.set('content-type', 'application/json')
    res.send(JSON.stringify(body, null, 2))
  })
})
app.listen(7676)
console.log('fetcher-dev:' + 7676)
