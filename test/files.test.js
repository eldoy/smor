var base = 'http://localhost:3000'

describe('Files', () => {
  it('should serve static css file', async () => {
    var result = await fetch(`${base}/css/app.css`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'text/css; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toMatch('body {')
  })

  it('should serve static js file', async () => {
    var result = await fetch(`${base}/js/app.js`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'application/javascript; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toMatch("console.log('Hello')")
  })

  it('should serve static html file', async () => {
    var result = await fetch(`${base}/file.html`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'text/html; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toMatch('<h1>File</h1>')
  })

  it('should serve static html index file', async () => {
    var result = await fetch(`${base}/`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'text/html; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toMatch('<h1>Hello</h1>')
  })

  it('should serve deep static html index file', async () => {
    var result = await fetch(`${base}/deep/`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'text/html; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toMatch('<h1>Deep</h1>')
  })

  it('should serve static html empty file', async () => {
    var result = await fetch(`${base}/empty.html`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'text/html; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toEqual('')
  })

  it('should serve static html tar.gz file', async () => {
    var result = await fetch(`${base}/file.tar.gz`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual('application/gzip')
    expect(typeof body).toEqual('string')
    expect(body).not.toEqual('')
  })

  it('should serve static html jquery.min.js file', async () => {
    var result = await fetch(`${base}/js/jquery.min.js`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'application/javascript; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toEqual('')
  })

  it('should support HEAD requests', async () => {
    var result = await fetch(`${base}/file.html`, { method: 'HEAD' })
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'text/html; charset=utf-8'
    )
    expect(typeof body).toEqual('string')
    expect(body).toEqual('')
  })

  it('should show 404 if not found', async () => {
    var result = await fetch(`${base}/not_found.html`)
    var body = await result.text()
    expect(result.status).toEqual(404)
    expect(typeof body).toEqual('string')
    expect(body).toEqual('')
  })

  it('should not traverse below root directory', async () => {
    var result = await fetch(`${base}/../index.js`)
    var body = await result.text()
    expect(result.status).toEqual(404)
    expect(typeof body).toEqual('string')
    expect(body).toEqual('')
  })

  it('should work with query parameters', async () => {
    var result = await fetch(`${base}/?query=1`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(typeof body).toEqual('string')
    expect(body).toMatch('Hello')
  })

  it('should support index file option', async () => {
    var result = await fetch(`${base}/?conf=1`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(typeof body).toEqual('string')
    expect(body).toMatch('Index2')
  })

  it('should support work with absolute paths', async () => {
    var result = await fetch(`${base}/file.html?conf=2`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(typeof body).toEqual('string')
    expect(body).toMatch('File')
  })

  it('should match filenames with special characters', async () => {
    var result = await fetch(`${base}/æøå.html?baner=æøø`)
    var body = await result.text()
    expect(result.status).toEqual(200)
    expect(typeof body).toEqual('string')
    expect(body).toMatch('æøå')
  })
})
