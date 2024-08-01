var http = require('http')
var smor = require('./index')

var CONFIGS = {
  1: {
    indexFile: 'index2.html',
    dir: 'dist'
  },
  2: {
    dir: process.cwd() + '/dist'
  }
}

var server = http.createServer((req, res) => {
  var query = req.url.split('?')[1]
  var config = query ? query.split('conf=')[1] : '0'
  var conf = CONFIGS[config] || { dir: 'dist' }
  smor(req, res, conf)
})

server.listen(3000)
