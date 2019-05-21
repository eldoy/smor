const http = require('http')
const hangersteak = require('./index')

const server = http.createServer((req, res) => {
  hangersteak(req, res, { dir: 'dist' })
})

server.listen(3000)
