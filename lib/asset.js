const fs = require('fs')

class Asset {
  constructor(req, filePath) {
    this.stat = fs.statSync(filePath)
    this.modifiedSince = req.headers['if-modified-since']
    this.modifiedDate = new Date(Date.parse(this.modifiedSince))
    this.lastModified = new Date(this.stat.mtime)
  }

  isFresh() {
    return this.modifiedSince && this.modifiedDate >= this.lastModified
  }
}

module.exports = Asset
