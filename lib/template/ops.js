const { createCompiler, defaultOperationsMap } = require('json-pn')
const { unar, binar, triar } = require('json-pn/lib/tools')
const stringTemplate = require('./strings.js')
const defaultValueName = '_item'
const defaultIndexName = '_index'
const defaultKeyName = '_key'
const allowQuery = [
  'first',
  'find',
  'text',
  'toArray',
  'children',
  'map',
  'get',
  'join',
  'eq',
  'slice',
  'trim',
  'html',
  'innerHTML',
]

const allowExtract = ['trim', 'join']

const extract = (target, path) => {
  // console.log(path)
  if (!target) return target
  else if (path.length === 0) {
    return target
  } else {
    const [...subpath] = path
    const key = subpath.shift().toString()

    if (target.hasOwnProperty(key)) {
      return extract(target[key], subpath)
    } else if (
      typeof target[key] === 'function' &&
      allowExtract.includes(key)
    ) {
      return extract(target[key](), subpath)
    } else {
      return undefined
    }
  }
}

const toPlain = ast => {
  if (!ast) {
    return ast
  } else if (Array.isArray(ast)) {
    return ast.map(toPlain)
  } else if (typeof ast === 'object') {
    return Object.keys(ast).reduce((clean, key) => {
      if (
        ![
          'next',
          'prev',
          'parent',
          '_root',
          'root',
          'prevObject',
          'parentNode',
          'previousSibling',
          'nextSibling',
          'nodeValue',
          'firstChild',
          'childNodes',
          'lastChild',
        ].includes(key)
      ) {
        clean[key] = toPlain(ast[key])
      }
      return clean
    }, {})
  } else {
    return ast
  }
}

const extend = (props, itemName, indexName) => (_item, _index) => {
  const indexObj = indexName ? { [indexName]: _index } : { _index }
  if (itemName) {
    return {
      ...props,
      [itemName]: _item,
      ...indexObj,
    }
  } else if (typeof _item === 'object' && !Array.isArray(_item)) {
    return { ...props, ..._item, ...indexObj }
  } else {
    return { ...props, _item, ...indexObj }
  }
}

const find = compiler => value => {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error('Provide [Two, Argumets]')
  }
  const list = compiler(value[0])
  const map = value[1]
  const valueName = value[2] && `${value[2]}`
  const indexName = value[3] && `${value[3]}`
  return props => {
    if (typeof props === 'object') {
      const compiledList = list(props)
      return (
        compiledList &&
        Array.isArray(compiledList) &&
        compiledList.find((e, i) =>
          compiler(map)(extend(props, valueName, indexName)(e, i))
        )
      )
    }
  }
}

const mapOperator = compiler => value => {
  if (!Array.isArray(value)) {
    throw new Error()
  }
  if (value.length < 2) {
    throw new Error('Provide [Two, Argumets]')
  }
  const list = compiler(value[0])
  const map = value[1]
  const valueName = value[2] && `${value[2]}`
  const indexName = value[3] && `${value[3]}`
  return props => {
    if (typeof props === 'object') {
      const compiledList = list(props)
      return (
        compiledList &&
        Array.isArray(compiledList) &&
        compiledList
          .map(extend(props, valueName, indexName))
          .map(compiler(map))
      )
    }
  }
}

const filter = compiler => value => {
  if (!Array.isArray(value)) {
    throw new Error()
  }
  if (value.length < 2) {
    throw new Error('Provide [Two, Argumets]')
  }
  const list = compiler(value[0])
  const map = value[1]
  const valueName = value[2] && `${value[2]}`
  const indexName = value[3] && `${value[3]}`
  return props => {
    if (typeof props === 'object') {
      const compiledList = list(props)
      return (
        compiledList &&
        Array.isArray(compiledList) &&
        compiledList.filter((item, index) =>
          compiler(map)(
            extend(props, valueName, indexName)(item, index)
          )
        )
      )
    }
  }
}

const pick = (compiler, value, props) => {
  const compiledValue = compiler(value)(props)
  const path = Array.isArray(compiledValue)
    ? compiledValue
    : [compiledValue]
  return extract(props, path)
}
const frontmatter = require('./operators/frontmatter')
const markdown = require('./operators/markdown')
const xml2json = require('../xml2json')
// const Prism = require('../prism.js')
const _highlight = require('./operators/highlight')
const builder = createCompiler({
  _highlight,
  _encode_uri: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    return typeof compiledValue === 'string'
      ? encodeURIComponent(compiledValue)
      : ''
  },
  _xml: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    return typeof compiledValue === 'string'
      ? xml2json(compiledValue, { compact: true })
      : {}
  },
  _xml_ast: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    return typeof compiledValue === 'string'
      ? xml2json(compiledValue, { compact: false })
      : {}
  },
  _markdown: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    const [body, type = 'ast'] = Array.isArray(compiledValue)
      ? compiledValue
      : [compiledValue, 'ast']
    const front = frontmatter(body)
    return {
      data: front.data,
      ...(type === 'ast'
        ? {
            excerpt: markdown.toAst(front.excerpt),
            content: markdown.toAst(front.content),
          }
        : {
            excerpt: markdown.toHtml(front.excerpt),
            content: markdown.toHtml(front.content),
          }),
    }
  },
  _md_front: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    return frontmatter(compiledValue)
  },
  _md_html: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    return markdown.toHtml(compiledValue)
  },
  _md_ast: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    return markdown.toAst(compiledValue)
  },
  _filter: filter,
  _find: find,
  _plain: unar(obj => toPlain(obj)),
  _null: compiler => value => props => {
    return null
  },
  _map: mapOperator, // defaultOperationsMap['@map'],
  _if: triar((opt, yes = true, no = false) => {
    return opt ? yes : no
  }),
  _lt: defaultOperationsMap['@lt'],
  _: compiler => value => props => pick(compiler, value, props),
  __: compiler => value => props =>
    stringTemplate(compiler(value)(props), props),
  _t: compiler => value => props =>
    stringTemplate(compiler(value)(props), props),
  _number: compiler => value => props => {
    return 0 | pick(compiler, value, props)
  },
  _add: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    if (Array.isArray(compiledValue)) {
      return compiledValue
        .slice(1)
        .reduce((sum, cur) => sum + cur, compiledValue[0])
    }
    return 0 | pick(compiler, value, props)
  },
  _mul: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    if (Array.isArray(compiledValue)) {
      return compiledValue
        .slice(1)
        .reduce((sum, cur) => sum * cur, compiledValue[0])
    }
    return 0 | pick(compiler, value, props)
  },
  _div: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    if (Array.isArray(compiledValue)) {
      return compiledValue
        .slice(1)
        .reduce((sum, cur) => sum / cur, compiledValue[0])
    }
  },
  _int: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    return 0 | compiledValue
  },
  _coalesce: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    if (Array.isArray(compiledValue)) {
      return compiledValue.find(
        v => v !== null && v !== undefined // && v !== NaN
      )
    } else {
      return compiledValue
    }
  },
  _or: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    if (Array.isArray(compiledValue)) {
      return compiledValue.find(Boolean)
    } else {
      return compiledValue
    }
  },
  _and: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    if (Array.isArray(compiledValue)) {
      return compiledValue.find(v => !v)
    } else {
      return compiledValue
    }
  },
  _eq: compiler => value => props => {
    const compiledValue = compiler(value)(props)
    if (Array.isArray(compiledValue)) {
      return compiledValue[0] === compiledValue[1]
    } else {
      return !!compiledValue
    }
  },
  _cb: compiler => value => props => {
    const arg1 = value[1] || 'first'
    const arg2 = value[2] || 'second'
    return (first, second) => {
      const extended = { ...props, [arg1]: first, [arg2]: second }
      return compiler(value[0])(extended)
    }
  },
  _with: compiler => value => props => {
    const template = value[1] || {}
    const context = extend(props, value[2])(
      compiler(value[0])(props)
    )
    return compiler(template)(context)
  },
  _query: compiler => value => props => {
    const [select, ...chain] = compiler(value)(props)
    if (props.$) {
      const result = chain
        ? chain
            .map(call => (typeof call === 'string' ? [call] : call))
            .filter(call => allowQuery.includes(call[0]))
            .reduce(
              (node, [method, argument]) => node[method](argument),
              props.$(select)
            )
        : props.$(select)
      return result
    }
    return null
  },
})

module.exports = (template, data) => builder(template)(data)
