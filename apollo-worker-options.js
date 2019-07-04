const fetch = require('node-fetch')
const Cache = require('./cache')
const cache = Cache('server_options')
module.exports = fetchOptions
async function fetchOptions(gistId) {
  let options = await cache.get(gistId)
  if (options) {
    return options
  } else {
    const data = await fetch(
      'https://api.github.com/gists/' + gistId,
      {
        headers: {
          'User-Agent': 'gcoda <gcoding@gmail.com>',
        },
      }
    ).then(res => res.json())

    const errors = {}
    const files = Object.values(data.files)

    const schemaFile = files.find(
      ({ language, filename }) =>
        filename === 'schema.gql' || language === 'GraphQL'
    )
    const typeDefs = schemaFile && schemaFile.content

    const envFile = files.find(
      ({ language, filename }) =>
        filename === 'env.json' || language === 'JSON'
    )
    const env = {}
    if (envFile && envFile.content) {
      try {
        Object.assign(env, JSON.parse(envFile.content))
      } catch (e) {
        errors.envFile = e
      }
    }
    options = { typeDefs, env }
    await cache.put(gistId, options)
    return options
  }
}
