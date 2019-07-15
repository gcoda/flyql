const fm = require('./frontmatter')
let r = {}
r.one = fm(`---
test: Value
---
#hello

content
`)
r.two = fm(`
#hello

content

<!-- more -->

mmore
`)
console.log(r)