const { SchemaDirectiveVisitor } = require('graphql-tools')
const inputIsResolver = ({ kind, directives }) => {
  if (kind === 'InputObjectTypeDefinition') {
    return !!directives.find(({ name }) => name.value === 'resolve')
  }
  return false
}
const not = filter => element => !filter(element)

const Resolver = require('./inputResolver')
const plainObject = ast => {
  if (ast.kind === 'ObjectValue') {
    return ast.fields.reduce((object, field) => {
      object[field.name.value] = plainObject(field.value)
      return object
    }, {})
  }
  if (ast.kind === 'ListValue') {
    return ast.values.map(plainObject)
  }
  if (ast.kind === 'IntValue') {
    return parseInt(ast.value)
  }
  if (ast.kind === 'FloatValue') {
    return parseFloat(ast.value)
  }
  if (ast.kind === 'StringValue' || ast.kind === 'EnumValue') {
    return ast.value
  }
  if (ast.kind === 'BooleanValue') {
    return ast.value
  }
  return ast
}
module.exports = typeDefs => {
  const inputResolvers = typeDefs.definitions
    .filter(inputIsResolver)
    .map(input => {
      const rename = input.directives
        .find(({ name }) => name.value === 'resolve')
        .arguments.find(({ name, value }) => name.value === 'name')
      const name = rename ? rename.value.value : input.name.value
      const directiveArguments = input.fields
      const config = input.directives.reduce((args, directive) => {
        const name = directive.name.value
        const value = directive.arguments.reduce(
          (configArgs, argument) => ({
            ...configArgs,
            [argument.name.value]: plainObject(argument.value),
          }),
          {}
        )
        return { ...args, [name]: value }
      }, {})
      return { name, directiveArguments, config }
    })
  const directiveTypeDefs = inputResolvers.map(options => {
    return {
      kind: 'DirectiveDefinition',
      locations: [{ kind: 'Name', value: 'FIELD_DEFINITION' }],
      name: { kind: 'Name', value: options.name },
      arguments: options.directiveArguments,
    }
  })
  // TODO new DataLoader
  /*
  options.config.batch
  */
  return {
    dataSources: {
      ['options.name']: {},
    },
    schemaDirectives: inputResolvers.reduce(
      (resolvers, options) => ({
        ...resolvers,
        [options.name]: Resolver({
          SchemaDirectiveVisitor,
          options,
        }),
      }),
      {
        fetch: Resolver({
          SchemaDirectiveVisitor,
            isFetchDirective: true,
            options: {
            config: { resolve: { template: { _: ['res'] } } },
          },
        }),
      }
    ),
    typeDefs: {
      kind: 'Document',
      definitions: typeDefs.definitions
        .filter(not(inputIsResolver))
        .concat(directiveTypeDefs),
    },
  }
}
