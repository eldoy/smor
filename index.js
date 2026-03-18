var fs = require('fs')
var path = require('path')
var mime = require('mime-types')
var compressible = require('compressible')
var accepts = require('accepts')
var vary = require('vary')
var zlib = require('zlib')
var rekvest = require('rekvest')

var NOTRANSFORM = /(?:^|,)\s*?no-transform\s*?(?:,|$)/
var THRESHOLD = 1024
var ROOT = process.cwd()
var DEFAULT_OPTIONS = {
  dir: '',
  maxAge: 3600,
  indexFile: 'index.html',
  compress: false
}

function send(res, status) {
  res.statusCode = status
  res.end()
}

function encoded(res) {
  return (res.getHeader('content-encoding') || 'identity') !== 'identity'
}

function transformable(res) {
  var cacheControl = res.getHeader('cache-control')
  return !cacheControl || !NOTRANSFORM.test(cacheControl)
}

function accepted(req) {
  var accept = accepts(req)
  return (
    accept.encoding('br') ||
    accept.encoding('gzip') ||
    accept.encoding('deflate', 'identity')
  )
}

function compressor(algorithm) {
  if (algorithm === 'deflate') return zlib.createDeflate()
  if (algorithm === 'br') return zlib.createBrotliCompress()
  return zlib.createGzip()
}

function pipe(req, res, options, fileName, filePath) {
  return function (status, headers, length) {
    var type = mime.lookup(fileName) || 'application/octet-stream'
    res.setHeader('content-type', mime.contentType(type))

    var stream = fs.createReadStream(filePath)

    if (
      options.compress &&
      req.method !== 'HEAD' &&
      length >= THRESHOLD &&
      !vary(res, 'accept-encoding') &&
      !encoded(res) &&
      transformable(res) &&
      compressible(type)
    ) {
      var algorithm = accepted(req)
      res.setHeader('content-encoding', algorithm)
      res.writeHead(status, headers)
      stream.pipe(compressor(algorithm)).pipe(res)
    } else {
      res.setHeader('content-length', length)
      res.writeHead(status, headers)
      if (req.method === 'HEAD') return res.end()
      stream.pipe(res)
    }
  }
}

async function fileStats(filePath) {
  try {
    return await new Promise(function (resolve, reject) {
      fs.stat(filePath, function (err, stat) {
        err ? reject(err) : resolve(stat)
      })
    })
  } catch (e) {}
}

async function asset(req, filePath) {
  var stat = await fileStats(filePath)
  if (!stat) return null
  var modifiedSince = req.headers['if-modified-since']
  var modifiedDate = new Date(Date.parse(modifiedSince))
  var lastModified = new Date(stat.mtime)
  var fresh = modifiedSince && modifiedDate >= lastModified
  return { stat, lastModified, fresh }
}

module.exports = async function (req, res, customOptions = {}) {
  var options = { ...DEFAULT_OPTIONS, ...customOptions }

  if (!req.pathname) rekvest(req)

  let fileName = req.pathname
  if (fileName.endsWith('/')) fileName += options.indexFile

  var base = options.dir.startsWith('/')
    ? options.dir
    : path.join(ROOT, options.dir)

  var filePath = path.join(base, fileName)

  var file = filePath.startsWith(base) ? await asset(req, filePath) : null

  if (!file) return send(res, 404)

  if (file.fresh) return send(res, 304)

  var stream = pipe(req, res, options, fileName, filePath)
  var totalSize = file.stat.size

  var headers = {
    'cache-control': `max-age=${options.maxAge}`,
    'last-modified': file.lastModified.toUTCString()
  }

  return stream(200, headers, totalSize)
}
