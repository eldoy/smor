var got = require('got')
var base = 'http://localhost:3000'

describe('Caching', () => {
  it('should not return last modified headers for files', async () => {
    var result = await got(`${base}/css/app.css`)
    expect(result.statusCode).toEqual(200)
    expect(result.headers['content-type']).toEqual('text/css; charset=utf-8')
    expect(result.headers['last-modified']).toBeDefined()
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('body {')
  })

  it('should return last modified headers for files', async () => {
    var result = await got({
      url: `${base}/css/app.css`,
      headers: {
        'if-modified-since': new Date().toUTCString()
      }
    })
    expect(result.statusCode).toEqual(304)
    expect(typeof result.body).toEqual('string')
    expect(result.body).toMatch('')
  })
})
