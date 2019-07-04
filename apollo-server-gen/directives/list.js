const { defaultFieldResolver } = require('graphql')
const { SchemaDirectiveVisitor } = require('graphql-tools')
module.exports = class ListResolverDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const directiveArgs = this.args
      const { resolve = defaultFieldResolver } = field
      field.resolve = async function(root, args, context, info) {
        const compiled = context.renderOps(directiveArgs, { root, args })
        if (Array.isArray(compiled.args))
          return Promise.all(
            compiled.args.map(arg => {
              return resolve(
                root,
                { ...arg, __OverrideArgs: arg },
                context,
                info
              )
            })
          ).then(list => list.filter(Boolean))
      }
    }
  }
