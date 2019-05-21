const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

// Ends the request
function end(res, status) {
  res.statusCode = status
  res.end()
}

// Set up a read stream
function pipe(res, fileName, filePath) {
  return function(status, headers, length, start, end) {
    headers['content-type'] = mime.contentType(mime.lookup(fileName) || 'application/octet-stream')
    headers['content-length'] = length
    res.writeHead(status, headers)
    fs.createReadStream(filePath, { start, end }).pipe(res)
  }
}

// Set up file asset
function asset(req, filePath) {
  const stat = fs.statSync(filePath)
  const modifiedSince = req.headers['if-modified-since']
  const modifiedDate = new Date(Date.parse(modifiedSince))
  const lastModified = new Date(stat.mtime)
  const fresh = modifiedSince && modifiedDate >= lastModified
  return { stat, modifiedSince, modifiedDate, lastModified, fresh }
}

// Main function
module.exports = function(req, res, options = {}) {
  // Default options
  if (!options.dir) {
    options.dir = ''
  }
  if (!options.maxAge) {
    options.maxAge = 3600
  }

  // File file name and path
  const fileName = req.url === '/' ? 'index.html' : decodeURIComponent(req.url)
  const filePath = path.join(process.cwd(), options.dir, fileName)

  // Return 404 if not found
  if (!fs.existsSync(filePath)) {
    end(res, 404)
  } else {
    const file = asset(req, filePath)
    // Return 304 Not Modified if possible
    if (file.fresh) {
      end(res, 304)
    } else {
      // Stream file if it exists
      const stream = pipe(res, fileName, filePath)
      const range = req.headers.range

      // Return a byte range if the client asks for it
      if (range) {
        const totalSize = file.stat.size
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
        const totalSize = file.stat.size
        stream(200, headers, totalSize)
      }
    }
  }
}
