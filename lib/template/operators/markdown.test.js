const { toAst, toHtml } = require('./markdown')
test('markdown to html', () => {
  expect(toHtml('# Header')).toBe('<h1>Header</h1>')
})
test('markdown to ast', () => {
  toAst('# Header').forEach(el => {
    expect(el).toHaveProperty('type')
  })
})
