const fetchOptions = require('./apollo-worker-options')
const Cache = require('./cache')
const cache = Cache('server_options')
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})
const createServer = require('./apollo-server-gen')

const { gql } = require('apollo-server-cloudflare')

const {
  graphqlCloudflare,
} = require('apollo-server-cloudflare/dist/cloudflareApollo')

const {
  handleOptions,
  corsHeaders,
  corsOptions,
} = require('./apollo-cors-options')

const playground = require('./playground')
async function handleRequest(event) {
  const request = event.request
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }
  const reqUrl = request.url.substring(8)
  const [host, route, ...params] = reqUrl.split('/')
  let debug = {
    buildTime: process.env.CF_WEBPACK,
  }
  if (route === 'graphql' && params[0]) {
    const gistId = params[0]

    const options =
      params[0] === 'live' || params[1] === 'live'
        ? await (async () => {
            const schemaRaw = request.headers.get('x-let-schema')
            const schema =
              schemaRaw && schemaRaw[0] === '"'
                ? JSON.parse(schemaRaw)
                : schemaRaw
            const live = {
              typeDefs:
                typeof schema === 'string'
                  ? schema
                  : `type Query {empty: String}`,
              env: JSON.parse(
                request.headers.get('x-let-env') || '{}'
              ),
            }
            if (
              request.headers.get('content-type') ===
              'application/json'
            ) {
              const copy = await request.clone()
              const body = await copy.json()
              if (body.variables) {
                if (body.variables.__letSchema) {
                  live.typeDefs = body.variables.__letSchema
                }
                if (body.variables.__letEnv) {
                  live.env = body.variables.__letEnv
                }
              }
            }
            return live
          })()
        : await fetchOptions(gistId).catch(() => null)
    debug.options = options
    let apolloBody = {}
    if (request.method === 'GET') {
      const response = new Response(playground({ gistId }), {
        status: 200,
      })
      response.headers.set('Content-type', 'text/html')
      return response
    } else {
      if (options && options.typeDefs) {
        try {
          const apolloRequest = new Request(
            `https://${gistId}.${host}/graphql`,
            {
              method: request.method,
              headers: request.headers,
              body: request.body,
              referrer: request.referrer,
              referrerPolicy: request.referrerPolicy,
              redirect: request.redirect,
              // ! unsupported on cloudflare
              // mode: request.mode,
              // credentials: request.credentials,
              // cache: request.cache,
              // integrity: request.integrity,
            }
          )
          const server = createServer({
            typeDefs: options.typeDefs,
            env: options.env,
          })
          await server.willStart() // !!! Run Plugins
          const apolloResponse = await graphqlCloudflare(() =>
            server.createGraphQLServerOptions(apolloRequest)
          )(apolloRequest).catch(error => ({ error }))
          apolloBody = await apolloResponse.json()
        } catch (apolloError) {
          apolloBody = { error: apolloError.message }
        }
      }

      const response = new Response(
        JSON.stringify(
          {
            ...apolloBody,
            debug: params[1] === 'debug' && {
              gistId,
              options,
              debug,
              host,
              route,
              params,
            },
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            ...corsHeaders(corsOptions),
            'content-type': 'application/json',
          },
        }
      )
      //response.headers.set('Content-type', 'application/json')
      return response
    }
  } else {
    let body = {}
    if (request.headers.get('content-type') === 'application/json') {
      // body = await request.json()
    }
    // const body = request.body
    return new Response(
      JSON.stringify(
        {
          body,
          ttype: 'ct: ' + request.headers.get('content-type'),
          typeDefs: request.headers.get('x-let-typedefs'),
          env: request.headers.get('x-let-env'),
          debug,
          host,
          route,
          params,
        },
        null,
        2
      ),
      { status: 200 }
    )
  }
}
