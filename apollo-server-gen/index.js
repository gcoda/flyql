// 'SchemaDirectiveVisitor' from graphql-tools
// const { ApolloServer, gql } = require('apollo-server')
const {
  ApolloServer,
  gql,
} = require('apollo-server-cloud-functions')

const fromBase = require('./typeDefs/base')
const generateResolvers = require('./typeDefs/generateResolvers')
const { renderOps, renderStrings } = require('./template')
const httpSource = require('./dataSources/http')
const ResolveDirective = require('./directives/resolve')
const ListDirective = require('./directives/list')
const fetchRetry = require('../lib/fetcher/retry')
const xml2json = require('../lib/xml2json')
const fetch = require('node-fetch')
module.exports = ({ typeDefs: schemaDefs, env }) => {
  const { schemaDirectives, typeDefs } = generateResolvers(
    fromBase(gql, schemaDefs)
  )
  return new ApolloServer({
    formatResponse: response => {
      if (
        response &&
        response.data &&
        response.data.__schema &&
        response.data.__schema.directives
      ) {
        return {
          data: {
            __schema: {
              ...response.data.__schema,
              directives: [],
            },
          },
        }
      }
      return response
    },
    debug: true, // process.env.NODE_ENV === 'development',
    schemaDirectives: {
      ListResolver: ListDirective,
      resolve: ResolveDirective,
      ...schemaDirectives,
    },
    typeDefs,
    introspection: true,
    dataSources: () => ({
      http: new httpSource({
        remoteFetcherUrl: process.env.FETCHER_URL,
        fetch: fetchRetry(fetch),
      }),
    }),
    context: () => {
      return {
        env,
        renderOps,
        renderStrings,
        xml2json,
      }
    },
  })
}
