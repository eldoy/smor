const request = require('request')
const base = 'http://localhost:3000'

describe('Files', () => {
  it('should serve static css file', (done) => {
    request.get({
      url: `${base}/css/app.css`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/css; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toMatch('body {')
      done()
    })
  })

  it('should serve static js file', (done) => {
    request.get({
      url: `${base}/js/app.js`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('application/javascript; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("console.log('Hello')")
      done()
    })
  })

  it('should serve static html file', (done) => {
    request.get({
      url: `${base}/file.html`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("<h1>File</h1>")
      done()
    })
  })

  it('should serve static html index file', (done) => {
    request.get({
      url: `${base}/`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("<h1>Hello</h1>")
      done()
    })
  })

  it('should serve deep static html index file', (done) => {
    request.get({
      url: `${base}/deep/`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toMatch("<h1>Deep</h1>")
      done()
    })
  })

  it('should serve static html empty file', (done) => {
    request.get({
      url: `${base}/empty.html`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toEqual('')
      done()
    })
  })

  it('should serve static html tar.gz file', (done) => {
    request.get({
      url: `${base}/file.tar.gz`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('application/gzip')
      expect(typeof body).toEqual('string')
      expect(body).not.toEqual('')
      done()
    })
  })

  it('should serve static html jquery.min.js file', (done) => {
    request.get({
      url: `${base}/js/jquery.min.js`,
      gzip: true
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('application/javascript; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toEqual('')
      done()
    })
  })

  it('should support HEAD requests', (done) => {
    request({
      method: 'HEAD',
      url: `${base}/file.html`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(res.headers['content-type']).toEqual('text/html; charset=utf-8')
      expect(typeof body).toEqual('string')
      expect(body).toEqual('')
      done()
    })
  })

  it('should show 404 if not found', (done) => {
    request({
      method: 'GET',
      url: `${base}/not_found.html`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(404)
      expect(typeof body).toEqual('string')
      expect(body).toEqual('')
      done()
    })
  })

  it('should not traverse below root directory', (done) => {
    request({
      method: 'GET',
      url: `${base}/../index.js`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(404)
      expect(typeof body).toEqual('string')
      expect(body).toEqual('')
      done()
    })
  })

  it('should work with query parameters', (done) => {
    request({
      method: 'GET',
      url: `${base}/?query=1`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(typeof body).toEqual('string')
      expect(body).toMatch('Hello')
      done()
    })
  })

  it('should support index file option', (done) => {
    request({
      method: 'GET',
      url: `${base}/?conf=1`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(typeof body).toEqual('string')
      expect(body).toMatch('Index2')
      done()
    })
  })

  it('should support work with absolute paths', (done) => {
    request({
      method: 'GET',
      url: `${base}/file.html?conf=2`
    },
    (err, res, body) => {
      expect(res.statusCode).toEqual(200)
      expect(typeof body).toEqual('string')
      expect(body).toMatch('File')
      done()
    })
  })
})
