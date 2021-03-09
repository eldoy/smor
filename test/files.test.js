const got = require('got')
const base = 'http://localhost:3000'

describe('Files', () => {
  it('should serve static css file', async () => {
    const result = await got(`${base}/css/app.css`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/css; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('body {')
  })

  it('should serve static js file', async () => {
    const result = await got(`${base}/js/app.js`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('application/javascript; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch("console.log('Hello')")
  })

  it('should serve static html file', async () => {
    const result = await got(`${base}/file.html`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch("<h1>File</h1>")
  })

  it('should serve static html index file', async () => {
    const result = await got(`${base}/`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch("<h1>Hello</h1>")
  })

  it('should serve deep static html index file', async () => {
    const result = await got(`${base}/deep/`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch("<h1>Deep</h1>")
  })

  it('should serve static html empty file', async () => {
    const result = await got(`${base}/empty.html`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toEqual('')
  })

  it('should serve static html tar.gz file', async () => {
    const result = await got(`${base}/file.tar.gz`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('application/gzip')
    expect(typeof result.body).toEqual('string')
    expect(result.body).not.toEqual('')
  })

  it('should serve static html jquery.min.js file', async () => {
    const result = await got(`${base}/js/jquery.min.js`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('application/javascript; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toEqual('')
  })

  it('should support HEAD requests', async () => {
    const result = await got({
      method: 'HEAD',
      url: `${base}/file.html`
    })
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/html; charset=utf-8')
    expect(typeof result.body).toEqual('string')
    expect(result.body).toEqual('')
  })

  it('should show 404 if not found', async () => {
    try {
      await got(`${base}/not_found.html`)
      expect(true).toBe(false)
    } catch(e) {
      const result = e.response
      expect(result.statusCode).toEqual(404)
      expect(typeof result.body).toEqual('string')
      expect(result.body).toEqual('')
    }
  })

  it('should not traverse below root directory', async () => {
    try {
      await got(`${base}/../index.js`)
      expect(true).toBe(false)
    } catch(e) {
      const result = e.response
      expect(result.statusCode).toEqual(404)
      expect(typeof result.body).toEqual('string')
      expect(result.body).toEqual('')
    }
  })

  it('should work with query parameters', async () => {
    const result = await got(`${base}/?query=1`)
    expect(result.statusCode).toEqual(200)
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('Hello')
  })

  it('should support index file option', async () => {
    const result = await got(`${base}/?conf=1`)
    expect(result.statusCode).toEqual(200)
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('Index2')
  })

  it('should support work with absolute paths', async () => {
    const result = await got(`${base}/file.html?conf=2`)
    expect(result.statusCode).toEqual(200)
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('File')
  })
})
