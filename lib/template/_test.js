const renderOps = require('./ops')
const context = {
  root: { __ids: [1, 2] },
  value: 321,
  bool: true,
  next: 'https://swapi.co/api/starships/?format=json&page=2',
  film: 'https://swapi.co/api/films/2/gfsdf/45',
  markdown: `---
  title: bla bla bla
---

# head

<h1>raw html</h1> text

\`\`\`graphql
type Query {some: String}
\`\`\`

## h2

more text

### table

| Header  | Another header |
|---------|----------------|
| field 1 | something      |
| field 2 | something else |
`,
}
const rendered = renderOps(
  {
    each: {
      _map: [
        [1, 2, { field: 'fieldValue' }, { one: 1, two: 2 }],
        {
          f: { _: 'field' },
          glob: { _: 'glob' },
          _v: { _: '_item' },
        },
      ],
    },
    some: 'text',
    value: { _: 'value' },
    string: { __: 'blabla ${value}' },
    undef: { __: ['blabla ${valueUndef}'] },
    match: { __: ['blabla ${next.match(/[0-9]+/)}'] },
    notMatch: { __: 'blabla ${bool.match(/[0-9]+/)}' },
    matchfilm: {
      __: ['blabla ${film.match(/films\\/([0-9]+)/).1}'],
    },
    md: {
      _with: [
        { _md_front: { _: 'markdown' } },
        {
          head: { _: 'data' },
          content: {
            _map: [
              { _md_ast: { _: 'content' } },
              {
                _if: [
                  { _eq: [{ _: ['node', 'type'] }, 'code'] },
                  {
                    type: 'html',
                    lang: { _: ['node', 'lang'] },
                    value: {
                      _concat: [
                        {
                          _t:
                            '<pre class="prismjs language-${node.lang}"><code class="language-${node.lang}">',
                        },
                        { _highlight: { _: 'node' } },
                        '</code></pre>',
                      ],
                    },
                  },
                  { _: ['node'] },
                ],
              },
              'node',
            ],
          },
          item: { _: '_item' },
        },
      ],
    },

    args: {
      _map: [
        { _: ['root', '__ids'] },
        { id: { _: 'value' }, lang: { _: ['root', '__lang'] } },
      ],
    },
  },
  context
)

console.dir(rendered, { depth: 4 })
