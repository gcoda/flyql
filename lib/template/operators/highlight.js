// const prism = require('prismjs')
// require('prismjs/components/prism-graphql.js')
// require('prismjs/components/prism-javascript.js')
// require('prismjs/components/prism-graphql.js')

const Prism = require('../../prism')
module.exports = compiler => value => props => {
  const compiledValue = compiler(value)(props)
  const code = compiledValue.value || compiledValue.code
  const lang = compiledValue.lang
  if (Prism.languages[lang]) {
    return Prism.highlight(code, Prism.languages[lang], lang)
  } else {
    return code
  }
}