const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const compressible = require('compressible')
const accepts = require('accepts')
const vary = require('vary')
const zlib = require('zlib')

const NOTRANSFORM = /(?:^|,)\s*?no-transform\s*?(?:,|$)/
const THRESHOLD = 1024
const ROOT = process.cwd()
const DEFAULT_OPTIONS = {
  dir: '',
  maxAge: 3600,
  indexFile: 'index.html'
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
  const cacheControl = res.getHeader('cache-control')
  return !cacheControl || !NOTRANSFORM.test(cacheControl)
}

// Find accepted compressor algorithm
function accepted(req) {
  const accept = accepts(req)
  let algorithm = accept.encoding(['br', 'gzip', 'deflate', 'identity'])
  if (algorithm === 'deflate' && accept.encoding(['gzip'])) {
    return accept.encoding(['gzip', 'identity'])
  }
  return algorithm
}

// Apply correct compressor, default is gzip
function compressor(algorithm) {
  if (algorithm === 'deflate') {
    return zlib.createDeflate()
  } else if (algorithm === 'br') {
    return zlib.createBrotliCompress()
  } else {
    return zlib.createGzip()
  }
}

// Set up a read stream
function pipe(req, res, fileName, filePath) {
  return function(status, headers, length, start, end) {
    const type = mime.lookup(fileName) || 'application/octet-stream'
    res.setHeader('content-type', mime.contentType(type))
    const stream = fs.createReadStream(filePath, { start, end })
    if (
      req.method !== 'HEAD' &&
      length >= THRESHOLD &&
      !vary(res, 'accept-encoding') &&
      !encoded(res) &&
      transformable(res) &&
      compressible(type)
    ) {
      const algorithm = accepted(req)
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
  let stat
  try {
    stat = await new Promise(function(resolve, reject) {
      fs.stat(filePath, function(err, stat) {
        err ? reject(err) : resolve(stat)
      })
    })
  } catch(e) {}
  return stat
}

// Set up file asset
async function asset(req, filePath) {
  const stat = await fileStats(filePath)
  if (!stat) {
    return null
  }
  const modifiedSince = req.headers['if-modified-since']
  const modifiedDate = new Date(Date.parse(modifiedSince))
  const lastModified = new Date(stat.mtime)
  const fresh = modifiedSince && modifiedDate >= lastModified
  return { stat, modifiedSince, modifiedDate, lastModified, fresh }
}

// Main function
module.exports = async function(req, res, customOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...customOptions }

  // File name and path
  const fileName = req.url.endsWith('/')
    ? req.url + options.indexFile
    : decodeURIComponent(req.url)
  const filePath = path.join(ROOT, options.dir, fileName)

  // Look for requested file
  const file = await asset(req, filePath)
  if (!file) {
    // Return 404 if not found
    send(res, 404)
  } else if (file.fresh) {
    // Return 304 Not Modified if possible
    send(res, 304)
  } else {
    // Stream file if it exists
    const stream = pipe(req, res, fileName, filePath)
    const totalSize = file.stat.size
    const range = req.headers.range

    // Return a byte range if the client asks for it
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1
      const chunkLength = (end - start) + 1
      const headers = {
        'content-range': `bytes ${start}-${end}/${totalSize}`,
        'accept-ranges': 'bytes'
      }
      stream(206, headers, chunkLength, start, end)
    } else {
      // Stream the full file if no range requested
      const headers = {
        'cache-control': `max-age=${options.maxAge}`,
        'last-modified': file.lastModified.toUTCString()
      }
      stream(200, headers, totalSize)
    }
  }
}
