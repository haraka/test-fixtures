'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const { describe, it, beforeEach } = require('node:test')

const constants = require('haraka-constants')

const {
  makePlugin,
  makeConnection,
  callConnect,
  callHelo,
  callMail,
  callRcpt,
  callDataPost,
  callQueue,
} = require('../index')
const { resolveMethod, toAddress } = require('../lib/hooks')

const fixturePath = path.join('test', 'fixtures', 'hook-plugin')

describe('typed hook helpers', () => {
  let plugin, conn
  beforeEach(() => {
    plugin = makePlugin(fixturePath)
    conn = makeConnection()
  })

  it('callConnect resolves via registered method', async () => {
    const r = await callConnect(plugin, conn)
    assert.equal(r.rc, undefined)
  })

  it('callHelo passes the helo host string through', async () => {
    const r = await callHelo(plugin, conn, 'mail.example.com')
    assert.equal(r.rc, undefined)
    assert.equal(conn.notes.last_helo, 'mail.example.com')
  })

  it('callMail wraps the address into [Address, params]', async () => {
    const r = await callMail(plugin, conn, 'sender@example.com')
    assert.equal(r.rc, undefined)
    assert.equal(conn.notes.last_mail_from, 'sender@example.com')
  })

  it('callRcpt wraps the address into [Address, params]', async () => {
    let captured
    plugin.hook_rcpt_echo = (next, c, params) => {
      captured = params
      next(constants.deny, 'no relay')
    }
    const r = await callRcpt(plugin, conn, 'rcpt@example.com')
    assert.equal(captured[0].address, 'rcpt@example.com')
    assert.deepEqual(captured[1], {})
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'no relay')
  })

  it('callDataPost handles a 4.0-style async hook returning {rc, msg}', async () => {
    const r = await callDataPost(plugin, conn)
    assert.equal(r.rc, 902)
    assert.equal(r.msg, 'no thanks')
  })

  it('callQueue handles a 4.0-style async hook returning [rc, msg]', async () => {
    const r = await callQueue(plugin, conn)
    assert.equal(r.rc, 903)
    assert.equal(r.msg, 'try later')
  })

  it('callMail accepts a pre-built Address object', async () => {
    const addr = toAddress('user@example.com')
    const r = await callMail(plugin, conn, addr)
    assert.equal(conn.notes.last_mail_from, 'user@example.com')
    assert.equal(r.rc, undefined)
  })

  it('callMail treats a string 4th arg as a method override (skipping params)', async () => {
    plugin.custom_mail = (next) => next(constants.deny, 'via override')
    const r = await callMail(plugin, conn, 'sender@example.com', 'custom_mail')
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'via override')
  })

  it('respects register_hook(hook, method) with a non-hook_ method name', async () => {
    // The aliases plugin pattern: this.register_hook('rcpt', 'aliases')
    plugin.aliases = (next, c, params) => {
      c.notes.handled_by = 'aliases'
      c.notes.rcpt_addr = params?.[0]?.address
      next()
    }
    plugin.hooks.rcpt = ['aliases']
    const r = await callRcpt(plugin, conn, 'user@example.com')
    assert.equal(r.rc, undefined)
    assert.equal(conn.notes.handled_by, 'aliases')
    assert.equal(conn.notes.rcpt_addr, 'user@example.com')
  })
})

describe('resolveMethod', () => {
  it('prefers the registered method from plugin.hooks', () => {
    const plugin = { name: 'p', hooks: { mail: ['custom_method'] }, custom_method: () => {} }
    assert.equal(resolveMethod(plugin, 'mail'), 'custom_method')
  })

  it('falls back to hook_<name>', () => {
    const plugin = { name: 'p', hooks: {}, hook_mail: () => {} }
    assert.equal(resolveMethod(plugin, 'mail'), 'hook_mail')
  })

  it('falls back to bare <name>', () => {
    const plugin = { name: 'p', hooks: {}, mail: () => {} }
    assert.equal(resolveMethod(plugin, 'mail'), 'mail')
  })

  it('respects an explicit override', () => {
    const plugin = { name: 'p', hooks: { mail: ['registered'] }, override: () => {}, registered: () => {} }
    assert.equal(resolveMethod(plugin, 'mail', 'override'), 'override')
  })

  it('throws when no method is found', () => {
    assert.throws(() => resolveMethod({ name: 'p', hooks: {} }, 'mail'), /no method/)
  })
})

describe('toAddress', () => {
  it('coerces a bare email string', () => {
    const a = toAddress('user@host')
    assert.equal(a.address, 'user@host')
  })

  it('passes through angle-bracketed strings', () => {
    const a = toAddress('<user@host>')
    assert.equal(a.address, 'user@host')
  })

  it('passes through Address instances unchanged', () => {
    const a = toAddress('user@host')
    assert.equal(toAddress(a), a)
  })

  it('coerces an {address} object', () => {
    const a = toAddress({ address: 'user@host' })
    assert.equal(a.address, 'user@host')
  })
})
