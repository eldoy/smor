const http = require('http')
const Hangersteak = require('./index')

const server = http.createServer((req, res) => {
  new Hangersteak(req, res, { dir: 'dist' })
})

server.listen(3000)
