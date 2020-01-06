const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

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

// Set up a read stream
function pipe(res, fileName, filePath) {
  return function(status, headers, length, start, end) {
    const type = mime.lookup(fileName) || 'application/octet-stream'
    headers['content-type'] = mime.contentType(type)
    headers['content-length'] = length
    res.writeHead(status, headers)
    fs.createReadStream(filePath, { start, end }).pipe(res)
  }
}

// Set up file asset
function asset(req, filePath) {
  let stat
  try {
    stat = fs.statSync(filePath)
  } catch(e) {
    return null
  }
  const modifiedSince = req.headers['if-modified-since']
  const modifiedDate = new Date(Date.parse(modifiedSince))
  const lastModified = new Date(stat.mtime)
  const fresh = modifiedSince && modifiedDate >= lastModified
  return { stat, modifiedSince, modifiedDate, lastModified, fresh }
}

// Main function
module.exports = function(req, res, customOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...customOptions }

  // File name and path
  const fileName = req.url === '/' ? options.indexFile : decodeURIComponent(req.url)
  const filePath = path.join(process.cwd(), options.dir, fileName)

  // Look for requested file
  const file = asset(req, filePath)
  if (!file) {
    // Return 404 if not found
    send(res, 404)
  } else if (file.fresh) {
    // Return 304 Not Modified if possible
    send(res, 304)
  } else {
    // Stream file if it exists
    const stream = pipe(res, fileName, filePath)
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
