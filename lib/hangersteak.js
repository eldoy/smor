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
      asset.isFresh() ? this.end(304) : this.serveFile(asset)
    } else {
      this.end(404)
    }
  }

  end(status) {
    this.res.statusCode = status
    this.res.end()
  }

  contentType(name) {
    return mime.contentType(mime.lookup(name) || 'application/octet-stream')
  }

  serveFile(asset) {
    const range = this.req.headers.range
    range ? this.fileRange(asset, range) : this.fileStream(asset)
  }

  fileRange(asset, range) {
    const totalSize = asset.stat.size
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1
    const chunkLength = (end - start) + 1
    const headers = {
      'content-range': `bytes ${start}-${end}/${totalSize}`,
      'accept-ranges': 'bytes'
    }
    this.pipe(206, headers, chunkLength, start, end)
  }

  fileStream(asset) {
    const headers = {
      'cache-control': `max-age=${this.options.maxAge}`,
      'last-modified': asset.lastModified.toUTCString()
    }
    const totalSize = asset.stat.size
    this.pipe(200, headers, totalSize)
  }

  pipe(status, headers, length, start, end) {
    headers['content-type'] = this.contentType(this.name)
    headers['content-length'] = length
    this.res.writeHead(status, headers)
    fs.createReadStream(this.path, { start, end }).pipe(this.res)
  }
}

module.exports = Hangersteak
