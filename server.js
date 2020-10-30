const http = require('http')
const hangersteak = require('./index')

const CONFIGS = {
  '1': {
    indexFile: 'index2.html',
    dir: 'dist'
  },
  '2': {
    dir: process.cwd() + '/dist'
  }
}

const server = http.createServer((req, res) => {
  const query = req.url.split('?')[1]
  const config = query ? query.split('conf=')[1] : '0'
  const conf = CONFIGS[config] || { dir: 'dist' }
  console.log({ conf })
  hangersteak(req, res, conf)
})

server.listen(3000)
