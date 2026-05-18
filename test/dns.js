'use strict'

const assert = require('node:assert/strict')
const { describe, it, before, after } = require('node:test')

const fixtures = require('../index')

describe('dns fixture', () => {
  let server, resolver

  before(async () => {
    server = await fixtures.dns.start({
      'good.example': {
        a: ['1.2.3.4', '5.6.7.8'],
        aaaa: ['2001:db8::1'],
        mx: [
          { preference: 10, exchange: 'mx1.good.example' },
          { preference: 20, exchange: 'mx2.good.example' },
        ],
        txt: ['v=spf1 -all'],
      },
      'nodata.example': { mx: [{ preference: 10, exchange: 'mx.nodata.example' }] },
      'broken.example': { rcode: 'SERVFAIL' },
      'refused.example': { rcode: 'REFUSED' },
      'slow.example': { a: ['9.9.9.9'], delayMs: 40 },
      'blackhole.example': { drop: true },
    })
    resolver = server.resolver({ timeout: 300, tries: 1 })
  })

  after(async () => {
    await server.close()
  })

  it('exported from index', () => {
    assert.equal('function', typeof fixtures.dns.start)
  })

  it('resolves A records', async () => {
    assert.deepEqual(await resolver.resolve4('good.example'), ['1.2.3.4', '5.6.7.8'])
  })

  it('resolves AAAA records', async () => {
    assert.deepEqual(await resolver.resolve6('good.example'), ['2001:db8::1'])
  })

  it('resolves MX records', async () => {
    const mx = await resolver.resolveMx('good.example')
    const byPref = mx.sort((a, b) => a.priority - b.priority).map(({ priority, exchange }) => ({ priority, exchange }))
    assert.deepEqual(byPref, [
      { priority: 10, exchange: 'mx1.good.example' },
      { priority: 20, exchange: 'mx2.good.example' },
    ])
  })

  it('resolves TXT records', async () => {
    assert.deepEqual(await resolver.resolveTxt('good.example'), [['v=spf1 -all']])
  })

  it('unknown name -> ENOTFOUND (NXDOMAIN)', async () => {
    await assert.rejects(resolver.resolveMx('absent.example'), (err) => {
      assert.equal(err.code, 'ENOTFOUND')
      return true
    })
  })

  it('name exists, wrong type -> ENODATA', async () => {
    await assert.rejects(resolver.resolve4('nodata.example'), (err) => {
      assert.equal(err.code, 'ENODATA')
      return true
    })
  })

  it('rcode SERVFAIL -> ESERVFAIL', async () => {
    await assert.rejects(resolver.resolveMx('broken.example'), (err) => {
      assert.equal(err.code, 'ESERVFAIL')
      return true
    })
  })

  it('rcode REFUSED -> EREFUSED', async () => {
    await assert.rejects(resolver.resolveMx('refused.example'), (err) => {
      assert.equal(err.code, 'EREFUSED')
      return true
    })
  })

  it('delayMs still resolves (slow path)', async () => {
    const start = Date.now()
    assert.deepEqual(await resolver.resolve4('slow.example'), ['9.9.9.9'])
    assert.ok(Date.now() - start >= 35, 'response was delayed')
  })

  it('drop -> resolver timeout', async () => {
    const fast = server.resolver({ timeout: 150, tries: 1 })
    await assert.rejects(fast.resolve4('blackhole.example'), (err) => {
      assert.ok(err.code, `got a DNS error code: ${err.code}`)
      return true
    })
  })

  it('setZone mutates behavior at runtime', async () => {
    server.setZone('good.example', { rcode: 'SERVFAIL' })
    await assert.rejects(resolver.resolve4('good.example'), (err) => {
      assert.equal(err.code, 'ESERVFAIL')
      return true
    })
  })

  it('patch() points an existing Resolver at the test server', async () => {
    const { Resolver } = require('node:dns').promises
    const other = new Resolver({ timeout: 300, tries: 1 })
    const restore = server.patch(other)
    server.setZone('patched.example', { a: ['7.7.7.7'] })
    assert.deepEqual(await other.resolve4('patched.example'), ['7.7.7.7'])
    restore()
    assert.deepEqual(other.getServers().length > 0, true)
  })
})
