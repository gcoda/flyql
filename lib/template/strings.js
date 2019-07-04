const allowedMethods = ['split', 'join', 'trim', 'match']

const detect = template => {
  // TODO Better RegExp
  const curlyRegExp = /\$\{([_a-zA-Z0-9\[\]\(\)\+\'\-\.\,\\\/]+?(\}?)+)\}/g
  const curlies = Array.from(template.matchAll(curlyRegExp)).map(
    ([match, path, ...rest]) => ({ match, path })
  )
  return curlies
}

const objectType = obj => {
  return typeof obj === 'object'
    ? Array.isArray(obj)
      ? 'array'
      : 'object'
    : typeof obj
}

const pick = (path = 'path.key', data = { path: { key: true } }) =>
  path
    .split(/\.(?=(?:[^\']*\'[^\']*\')*[^\']*$)/)
    .reduce((object, key, index, pathArray) => {
      if (key && key.indexOf('(') > -1) {
        const match = key.match(/([a-zA-Z]+)\((.*)\)/)
        if (match && allowedMethods.includes(match[1])) {
          const method = match[1]
          const param = match[2]
          const arg =
            param && param[0] === "'" ? param.slice(1, -1) : param
          if (method === 'match') {
            if (arg[0] === '/') {
              const re = arg.substring(1, arg.lastIndexOf('/'))
              const flags = arg.substring(arg.lastIndexOf('/') + 1)
              const resultMatch = `${object}`.match(
                new RegExp(re, flags)
              )
              return resultMatch || ''
            }
          }
          return (
            object[method] &&
            object[method](arg.replace(/\\\\/g, '\\'))
          )
        } else return object
      } else {
        return (
          object &&
          (key === 'length' && pathArray.length - 1 === index
            ? object.length
            : object[key])
        )
      }
    }, data)

const canBePath = path => {
  return path.indexOf(' ') === -1 && path.indexOf('{') === -1
}

const renderStringValue = (template, data) => {
  const tokens = detect(template)
  let result = template
  for (let { match, path } of tokens) {
    const value = pick(path, data)
    result = result.replace(match, value !== undefined ? value : '')
  }
  return String(result) ? result : undefined
}

const transform = (obj, data) => {
  const type = objectType(obj)
  if (type === 'array') {
    return obj.map(element => transform(element, data))
  } else if (type === 'object') {
    const keys = obj ? Object.keys(obj) : []

    return keys.reduce((results, key) => {
      let field = { [key]: transform(obj[key], data) }
      return {
        ...results,
        ...field,
      }
    }, {})
  } else if (type === 'string') {
    return renderStringValue(obj, data)
  } else {
    return obj
  }
}

module.exports = transform