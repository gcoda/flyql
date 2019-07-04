const renderOps = require('./ops')
const context = {
  root: {__ids: [1,2]},
  value: 321,
  bool: true,
  next: 'https://swapi.co/api/starships/?format=json&page=2',
  film: 'https://swapi.co/api/films/2/gfsdf/45',
  markdown: `---
  title: bla bla bla
---

# head

text

## h2
more text

### table

| Header  | Another header |
|---------|----------------|
| field 1 | something      |
| field 2 | something else |
`,
}
console.dir(
  renderOps(
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
            content: { _md_html: { _: 'content' } },
            item: { _: '_item' },
          },
        ],
      },

      args: {
        _map: [
          { _: ['root', '__ids'] },
          { id: { _: 'value' }, lang: { _: ['root', '__lang'] } }
        ]
      }
    },
    context
  ),
  { depth: 8 }
)
