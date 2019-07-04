const unified = require('unified')
const markdown = require('remark-parse')
const remark2rehype = require('remark-rehype')
const htmlRaw = require('rehype-raw')
const htmlStringify = require('rehype-stringify')
// remark-parse remark-rehype rehype-raw rehype-stringify
const mdOptions = {
  commonmark: true,
  footnotes: true,
}
const htmlOptions = {
  allowDangerousHTML: true,
  quoteSmart: true,
  closeSelfClosing: true,
  entities: { useShortestReferences: true },
}

const toHtml = text => {
  return  unified()
    .use(markdown, mdOptions)
    .use({ settings: { position: false } })
    .use(remark2rehype, htmlOptions)
    .use(htmlRaw)
    .use(htmlStringify)
    .processSync(text)
    .toString()
}
const toAst = text => {
  const hast =  unified()
    .use(markdown, mdOptions)
    .use({ settings: { position: false } })
    .parse(text)
  if (hast.children) {
    return hast.children
  } else {
    return []
  }
}
module.exports = { toAst, toHtml }