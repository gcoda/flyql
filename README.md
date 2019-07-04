## development

entr \ nodemon `node dev.js`
runs apollo on 7878 port and fetcher on 7676

## deploy

`npm run deploy`

# TODO \\ Consider

### \_xml:

- remove `[key]` from children array
  \_xml:
- maybe make key@text and or key@children not nullable? without `key: 'text'` magic
- ?? `key: {_text: ''}`

## apollo-server-gen

entrypoint ./apollo-worker.js
if {dataSources: http} does not provide `remoteFetcherUrl`

- uses `./lib/fetcher`

uses ./fetcher-worker/makeCacheKey

## ./fetch-worker/\*

using /lib/fetcher
using /lib/template

standalone http function

```javascript
input = [{ url: 'http...', response: 'JSON' }, { url: '...' }]
```
