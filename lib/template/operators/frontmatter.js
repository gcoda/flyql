const hjson = require('hjson')
module.exports = (
  text,
  delimiter = '---',
  excerptSep = '<!-- more -->'
) => {
  const startString = delimiter + '\n'
  const endString = '\n' + delimiter + '\n'
  const headEnd = text.indexOf(endString)

  const headText =
    headEnd !== -1 &&
    text.slice(0, startString.length) === startString
      ? text.slice(startString.length, headEnd)
      : ''
  const content = text.slice(headEnd + endString.length)
  const excerptEnd = content.indexOf(excerptSep)
  const excerpt =
    excerptSep && excerptEnd !== -1
      ? content.slice(0, excerptEnd)
      : content.slice(0, content.indexOf('\n'))
  let data = {}
  try {
    data = hjson.parse(headText)
  } catch (e) {
    // console.log(e)
  }
  return { data, excerpt, content }
}
