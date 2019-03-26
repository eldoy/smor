const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const Asset = require('./asset')

class Hangersteak {
  constructor(req, res, options = {}) {
    this.req = req
    this.res = res
    this.options = this.setOptions(options)
    this.name = req.url === '/' ? 'index.html' : decodeURIComponent(req.url)
    this.path = path.join(process.cwd(), this.options.dir, this.name)
    this.respond()
  }

  setOptions(options) {
    if (!options.dir) {
      options.dir = ''
    }
    if (!options.maxAge) {
      options.maxAge = 3600
    }
    return options
  }

  respond() {
    if (fs.existsSync(this.path)) {
      const asset = new Asset(this.req, this.path)
      asset.isFresh() ? this.notModified() : this.serveFile(asset)
    } else {
      this.notFound()
    }
  }

  serveFile(asset) {
    this.res.writeHead(200, {
      'content-type': this.contentType(this.name),
      'content-length': asset.stat.size,
      'cache-control': `max-age=${this.options.maxAge}`,
      'last-modified': asset.lastModified.toUTCString()
    })
    fs.createReadStream(this.path).pipe(this.res)
  }

  notModified() {
    this.res.statusCode = 304
    this.res.end()
  }

  notFound() {
    this.res.writeHead(404, {
      'content-type': 'text/plain; charset=utf-8',
      'content-length': 0
    })
    this.res.end()
  }

  contentType(name) {
    return mime.contentType(mime.lookup(name) || 'application/octet-stream')
  }
}

module.exports = Hangersteak
