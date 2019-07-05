module.exports = (gql, document) => gql`
  scalar JSON

  directive @resolve(
    template: JSON
    fetch: JSON
    templateData: [String]
    templateContext: String
  ) on INPUT_OBJECT | FIELD_DEFINITION

  scalar Expression

  directive @ListResolver(args: Expression) on FIELD_DEFINITION

  # directive @forceType on FIELD_DEFINITION
  # directive @fake(
  #   length: Int
  # ) on FIELD_DEFINITION
  # directive @transform(
  #   to: [JSON!] # """Default Data"""
  # ) on FIELD_DEFINITION
  # directive @_(
  #   n: JSON! # """Default Data"""
  # ) on FIELD_DEFINITION
  
  enum FetchMethod {
    GET
    POST
    HEAD
    PUT
    DELETE
  }
  enum FetchRedirect {
    follow
    manual
    error
  }

  enum FetchResponseType {
    JSON
    TEXT
    MARKDOWN
    MARKDOWN_AST
    BLOB
    XML
  }
  directive @fetch(
    """
    A string representing the URL for fetching
    """
    url: String!
    method: FetchMethod = GET
    """
    **camelCase** Request headers
    if \`body\` is object will automatically use
    \`contentType: "application/json"\`
    """
    headers: JSON
    body: JSON
    """
    \`manual\` to extract redirect headers
    \`error\` to reject redirect
    """
    redirect: FetchRedirect
    """
    Maximum redirect count. 0 to not follow redirect
    """
    follow: Int = 10
    """
    Request / Response timeout in ms, it resets on redirect. 0 to disable
    """
    timeout: Int = 10000
    """
    Maximum response body size in bytes. 0 to disable
    """
    size: Int = 0
    extraCacheKeyData: JSON
    maxAge: Int
    response: FetchResponseType
  ) on FIELD_DEFINITION | INPUT_OBJECT
  
  ${document || ''}
`
