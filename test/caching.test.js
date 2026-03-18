var base = 'http://localhost:3000'

describe('Caching', () => {
  it('should not return last modified headers for files', async () => {
    var result = await fetch(`${base}/css/app.css`)
    var body = await result.text()

    expect(result.status).toEqual(200)
    expect(result.headers.get('content-type')).toEqual(
      'text/css; charset=utf-8'
    )
    expect(result.headers.get('last-modified')).not.toBeNull()
    expect(typeof body).toEqual('string')
    expect(body).toMatch('body {')
  })

  it('should return last modified headers for files', async () => {
    var result = await fetch(`${base}/css/app.css`, {
      headers: {
        'if-modified-since': new Date().toUTCString()
      }
    })
    var body = await result.text()

    expect(result.status).toEqual(304)
    expect(typeof body).toEqual('string')
    expect(body).toEqual('')
  })
})
