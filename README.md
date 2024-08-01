# Smør

Node web static files server with built in compression support.

### Install

```
npm i smor
```

### Usage

Vanilla NodeJS server. Will return 404 if not found, or the file using streams and correct mime type. Supports automatic 304 last modified headers.

```js
var http = require('http')
var smor = require('smor')

var server = http.createServer((req, res) => {
  // Using default options
  smor(req, res)

  // With options, default values shown
  smor(req, res, {
    dir: '', // Start with '/' to use absolute path
    maxAge: 3600,
    indexFile: 'index.html',
    compress: false
  })
})

server.listen(3000)
```

MIT licensed. Enjoy!

Created by [Eldøy Projects](https://eldoy.com)
