const { defaultFieldResolver } = require('graphql')

module.exports = ({
  SchemaDirectiveVisitor,
  options,
  isFetchDirective = false,
}) => {
  class BuildResolverDirective extends SchemaDirectiveVisitor {
    visitInputObject(object) {
      return object
    }
    visitFieldDefinition(field) {
      const directiveArgs = this.args
      const { resolve = defaultFieldResolver } = field
      const resolveTemplate = options.config.resolve.template || {
        _: ['res', 'body'],
      }
      // const fetchOptions = options.config.fetch
      field.resolve = async function(
        parent,
        resolveArgs,
        context,
        info
      ) {
        if (isFetchDirective && !options.config.fetch) {
          options.config.fetch = directiveArgs
        }
        // console.dir({ options, isFetchDirective })
        const { __OverrideArgs, ...args } = resolveArgs
        // const args = __OverrideArgs || defaultArgs
        const root = await resolve(
          parent,
          __OverrideArgs || args,
          context,
          info
        )

        const compilerContext = {
          parent,
          args,
          root,
          env: context.env,
          req: {
            headers: context.headers,
            cookies: context.cookies,
          },
        }
        const fetchArgs = context.renderOps(
          __OverrideArgs
            ? { ...directiveArgs, ...__OverrideArgs }
            : directiveArgs,
          compilerContext
        )

        const dataContext = {
          ...compilerContext,
          args: fetchArgs,
        }

        const fetchDirectiveOptions = context.renderStrings(
          options.config.fetch,
          dataContext
        )

        // TODO maxAge and scope fallback to cacheControl context
        // TODO if PRIVATE, comile context.sessionId
        // TODO Compile extraCacheKey

        const fetchOptions = options.config.resolve.fetch
          ? {
              ...fetchDirectiveOptions,
              ...context.renderOps(
                options.config.resolve.fetch,
                dataContext
              ),
            }
          : fetchDirectiveOptions || {}

        /*
        TODO: if cacheControl scope: PRIVATE
        load(..., ...sessionId)
        */

        const fetchResponse = fetchOptions.url
          ? await context.dataSources.http.load(fetchOptions)
          : {}

        // const { parsed, ...res } = fetchResponse || {}
        // if (fetchOptions.response === 'XML' && context.xml2json) {
        //   res.body = context.xml2json(res.body, { compact: true })
        // } else if (
        //   fetchOptions.response === 'XML_FULL' &&
        //   context.xml2json
        // ) {
        //   res.body = context.xml2json(res.body, { compact: false })
        // }
        // const data = { ...dataContext, res }
        const data = { ...dataContext, res: fetchResponse }

        const templateDataPath = options.config.resolve.templateData
        const templateData = Array.isArray(templateDataPath)
          ? templateDataPath.reduce(
              (results, key) => results && results[key],
              data
            )
          : data

        const dataMergable =
          templateDataPath &&
          typeof templateData === 'object' &&
          !Array.isArray(templateData)

        const contextKey = options.config.resolve.templateContext

        const finalContext =
          templateDataPath || contextKey
            ? {
                [contextKey || 'ctx']: data,
                ...(dataMergable
                  ? templateData
                  : { data: templateData }),
              }
            : templateData

        let $ = null
        // if (fetchOptions.response === 'XML' && context.cheerio) {
        //   try {
        //     $ = context.cheerio.load(res.body)
        //   } catch (e) {
        //     if (!context.silentErrors) {
        //       throw new Error('malformed xml')
        //     }
        //   }
        // }
        const resultValue = context.renderOps(resolveTemplate, {
          ...finalContext,
          $,
        })
        return resultValue
      }
    }
  }
  return BuildResolverDirective
}
