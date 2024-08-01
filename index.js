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

// Sends the request
function send(res, status) {
  res.statusCode = status
  res.end()
}

// Check if we already encoded compression
function encoded(res) {
  return (res.getHeader('content-encoding') || 'identity') !== 'identity'
}

// Don't transform if cache-control no-transform is set
function transformable(res) {
  var cacheControl = res.getHeader('cache-control')
  return !cacheControl || !NOTRANSFORM.test(cacheControl)
}

// Find accepted compressor algorithm
function accepted(req) {
  var accept = accepts(req)
  return (
    accept.encoding('br') ||
    accept.encoding('gzip') ||
    accept.encoding('deflate', 'identity')
  )
}

// Apply correct compressor, default is gzip
function compressor(algorithm) {
  if (algorithm === 'deflate') return zlib.createDeflate()
  if (algorithm === 'br') return zlib.createBrotliCompress()
  return zlib.createGzip()
}

// Set up a read stream
function pipe(req, res, options, fileName, filePath) {
  return function (status, headers, length, start, end) {
    var type = mime.lookup(fileName) || 'application/octet-stream'
    res.setHeader('content-type', mime.contentType(type))
    var stream = fs.createReadStream(filePath, { start, end })
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
      stream.pipe(res)
    }
  }
}

// Get file stats
async function fileStats(filePath) {
  try {
    return await new Promise(function (resolve, reject) {
      fs.stat(filePath, function (err, stat) {
        err ? reject(err) : resolve(stat)
      })
    })
  } catch (e) {}
}

// Set up file asset
async function asset(req, filePath) {
  var stat = await fileStats(filePath)
  if (!stat) return null
  var modifiedSince = req.headers['if-modified-since']
  var modifiedDate = new Date(Date.parse(modifiedSince))
  var lastModified = new Date(stat.mtime)
  var fresh = modifiedSince && modifiedDate >= lastModified
  return { stat, modifiedSince, modifiedDate, lastModified, fresh }
}

// Main function
module.exports = async function (req, res, customOptions = {}) {
  var options = { ...DEFAULT_OPTIONS, ...customOptions }

  // Parse request if pathname is missing
  if (!req.pathname) rekvest(req)

  // File name and path
  let fileName = req.pathname
  if (fileName.endsWith('/')) fileName += options.indexFile

  var base = options.dir.startsWith('/')
    ? options.dir
    : path.join(ROOT, options.dir)
  var filePath = path.join(base, fileName)

  // Look for requested file
  var file = filePath.startsWith(base) ? await asset(req, filePath) : null

  // Return 404 if not found
  if (!file) return send(res, 404)

  // Return 304 Not Modified if possible
  if (file.fresh) return send(res, 304)

  // Stream file if it exists
  var stream = pipe(req, res, options, fileName, filePath)
  var totalSize = file.stat.size
  var range = req.headers.range

  // Stream the full file if no range requested
  if (!range) {
    var headers = {
      'cache-control': `max-age=${options.maxAge}`,
      'last-modified': file.lastModified.toUTCString()
    }
    return stream(200, headers, totalSize)
  }

  // Return a byte range if the client asks for it
  var parts = range.replace(/bytes=/, '').split('-')
  var start = parseInt(parts[0])
  var end = parts[1] ? parseInt(parts[1]) : totalSize - 1
  var chunkLength = end - start + 1
  var headers = {
    'content-range': `bytes ${start}-${end}/${totalSize}`,
    'accept-ranges': 'bytes'
  }
  stream(206, headers, chunkLength, start, end)
}
