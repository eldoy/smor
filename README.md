# Hangersteak

Node web static files server

### INSTALL
```npm i hangersteak``` or ```yarn add hangersteak```

### USAGE
Vanilla NodeJS server. Will return 404 if not found, or the file using streams and correct mime type. Supports automatic 304 last modified headers.
```
const http = require('http')
const Hangersteak = require('./index')

const server = http.createServer((req, res) => {
  new Hangersteak(req, res, { dir: 'dist' })
})

server.listen(3000)
```
MIT licensed. Enjoy!
