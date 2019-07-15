const corsOptions = {
  origin: '*',
  headers: [
    'content-type',
    'x-apollo-tracing',
    'authorization',
    'apollo-query-plan-experimental',
    'x-let-schema',
    'x-let-env'
  ],
}
const corsHeaders = ({
  origin = corsOptions.origin,
  headers = corsOptions.headers,
} = corsOptions) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    headers.length > 1 ? headers.join(', ') : headers[0],
})

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: corsHeaders(),
    })
  } else {
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS',
      },
    })
  }
  /* */
}
module.exports = {handleOptions, corsHeaders, corsOptions}