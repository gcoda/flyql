const { defaultFieldResolver } = require('graphql')
const { SchemaDirectiveVisitor } = require('graphql-tools')

class ResolveDirective extends SchemaDirectiveVisitor {
  visitInputObject(object) {
    return object
  }
  visitFieldDefinition(field) {
    const directiveArgs = this.args
    const {
      templateContext,
      templateData: templateDataPath,
    } = directiveArgs
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function(root, args, context, info) {
      const res = await resolve(root, args, context, info)

      const data = { res, root, args, env: context.env }

      const templateData = Array.isArray(templateDataPath)
        ? templateDataPath.reduce(
            (results, key) => results && results[key],
            data
          )
        : data

      const compilerContext =
        templateContext &&
        typeof templateData === 'object' &&
        !Array.isArray(templateData)
          ? {
              [templateContext]: data,
              ...templateData,
            }
          : templateData

      return context.renderOps(
        directiveArgs.template || {},
        compilerContext
      )
    }
  }
}

module.exports = ResolveDirective
