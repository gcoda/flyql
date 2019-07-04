const parser = require('htmlparser2')

const compactor = (obj, el) => {
  return el
    ? Object.keys(el).reduce((merged, key) => {
        if (merged[key] && Array.isArray(merged[key])) {
          merged[key] = [...merged[key], el[key]]
        } else if (merged[key]) {
          merged[key] = [merged[key], el[key]]
        } else {
          merged[key] = el[key]
        }
        return merged
      }, obj)
    : obj
  // { ...obj, ...el }
}
const plain = (node, compact = true) => {
  if (Array.isArray(node)) {
    return compact
      ? node.map(n => plain(n, compact)).reduce(compactor, {})
      : node.map(n => plain(n, compact))
  } else {
    if (node.name) {
      const text =
        (node.children &&
          node.children.reduce(
            (text, { type, data }) =>
              type === 'text' ? text + data.trim() : text,
            ''
          )) ||
        null
      const attributes = Object.keys(node.attribs || {}).length
        ? node.attribs
        : null
      const children =
        node.children &&
        node.children.filter(({ type }) => type !== 'text')
      if (compact) {
        if (text && !attributes && !children.length) {
          return {
            [node.name]: text,
          }
        } else if (!text && children && children.length) {
          return {
            [node.name]: children
              .map(n => plain(n, compact))
              .reduce(compactor, {}),
          }
        } else {
          return children && children.length
            ? {
                [`${node.name}@text`]: text,
                [node.name]: children
                  .map(n => plain(n, compact))
                  .reduce(compactor, {}),
              }
            : {
                [`${node.name}@attributes`]: attributes,
                [node.name]: text,
              }
        }
      } else {
        return {
          [node.name]: {
            text,
            attributes,
            children:
              children && children.map(n => plain(n, compact)),
          },
        }
      }
    }
  }
}
const xml2json = (
  text,
  { compact = false, ...parserOptions } = {}
) => {
  const ast = parser.parseDOM(text, {
    xmlMode: true,
    lowerCaseTags: false,
    decodeEntities: true,
    ...parserOptions,
  })
  const re = plain(ast, compact)
  // console.dir(re, { depth: 9 })
  return re
}
module.exports = xml2json
// console.dir(xml2json(xml), { depth: 9 })
