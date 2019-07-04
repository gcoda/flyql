
const responseHandler = require('./responseHandler')

addEventListener('fetch', event => {
  event.respondWith(responseHandler(event))
})
