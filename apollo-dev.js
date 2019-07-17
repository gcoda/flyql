process.env.NODE_ENV = 'development'
process.env.FETCHER_URL = 'http://localhost:7676'
const fetchOptions = require('./apollo-worker-options')
const createServer = require('./apollo-server-gen')
const schema = require('fs').readFileSync('./apollo-dev.gql', {
  encoding: 'utf8',
})
const playground = require('./playground')
const app = require('express')()

const cors = require('cors')
app.use(cors())

const bodyParser = require('body-parser')
app.use(bodyParser.json())

app.get('*', (req, res) => {
  res.send(playground({}))
})
app.post('*', (req, res) => {
  const fromHeader =
    req.get('x-let-schema') && JSON.parse(req.get('x-let-schema'))
  const envHeaders =
    req.get('x-let-env') && JSON.parse(req.get('x-let-env'))
  const fromVariables =
    req.body && req.body.variables && req.body.variables.__letSchema
  const server = createServer({
    env: envHeaders || require('./apollo-dev.env'),
    typeDefs: fromHeader || fromVariables || schema,
  })
  const graphql = server.createHandler()
  graphql(req, res)
})

app.listen(7878)
console.log('apollo-dev:' + 7878)
