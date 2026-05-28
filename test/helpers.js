'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const { describe, it } = require('node:test')

const constants = require('haraka-constants')

const { callHook, makePlugin, makeConnection, getResult } = require('../index')

describe('callHook', () => {
  it('resolves with rc and msg from next()', async () => {
    const plugin = new (require('../lib/plugin'))(path.join('test', 'fixtures', 'hook-plugin'))
    plugin.register()
    const conn = makeConnection()
    const { rc, msg } = await callHook(plugin, 'hook_rcpt_echo', conn, [constants.DENY, 'no thanks'])
    assert.equal(rc, constants.DENY)
    assert.equal(msg, 'no thanks')
  })

  it('resolves with undefined rc when next() is called with no args', async () => {
    const plugin = new (require('../lib/plugin'))(path.join('test', 'fixtures', 'hook-plugin'))
    plugin.register()
    const conn = makeConnection()
    const { rc, msg } = await callHook(plugin, 'hook_rcpt_echo', conn, [])
    assert.equal(rc, undefined)
    assert.equal(msg, undefined)
  })
})

describe('makePlugin', () => {
  it('returns a Plugin instance', () => {
    const plugin = makePlugin(path.join('test', 'fixtures', 'hook-plugin'))
    assert.ok(plugin)
    assert.equal(typeof plugin.register, 'function')
  })

  it('calls register() by default', () => {
    const plugin = makePlugin(path.join('test', 'fixtures', 'hook-plugin'))
    assert.ok(plugin.hooks.rcpt)
  })

  it('skips register() when register=false', () => {
    const plugin = makePlugin(path.join('test', 'fixtures', 'hook-plugin'), { register: false })
    assert.equal(plugin.hooks.rcpt, undefined)
  })
})

describe('makeConnection', () => {
  it('returns a Connection with default remote.ip', () => {
    const conn = makeConnection()
    assert.equal(conn.remote.ip, '127.0.0.1')
  })

  it('sets remote.ip from opts.ip', () => {
    const conn = makeConnection({ ip: '10.0.0.1' })
    assert.equal(conn.remote.ip, '10.0.0.1')
  })

  it('does not create a transaction by default', () => {
    const conn = makeConnection()
    assert.equal(conn.transaction, null)
  })

  it('creates a transaction when withTxn=true', () => {
    const conn = makeConnection({ withTxn: true })
    assert.ok(conn.transaction)
  })

  it('sets _relaying from opts.relaying', () => {
    const conn = makeConnection({ relaying: true })
    assert.equal(conn.relaying, true)
  })

  it('routes relaying through the transaction when a transaction is created', () => {
    // matches Connection.relaying setter semantics: when transaction exists,
    // relaying is stored on the transaction (so reset_transaction clears it)
    const conn = makeConnection({ relaying: true, withTxn: true })
    assert.equal(conn.relaying, true)
    assert.equal(conn.transaction._relaying, true)
  })

  it('sets hello from opts.helo', () => {
    const conn = makeConnection({ helo: 'mail.example.com' })
    assert.equal(conn.hello.host, 'mail.example.com')
    assert.equal(conn.hello.verb, 'EHLO')
  })

  it('leaves hello unset when opts.helo is not given', () => {
    const conn = makeConnection()
    assert.equal(conn.hello.host, null)
  })

  it('seeds connection.notes', () => {
    const conn = makeConnection({ notes: { foo: 1 } })
    assert.equal(conn.notes.foo, 1)
  })

  it('mailFrom implies a transaction', () => {
    const conn = makeConnection({ mailFrom: 'sender@example.com' })
    assert.ok(conn.transaction)
    assert.equal(conn.transaction.mail_from.address, 'sender@example.com')
  })

  it('mailFrom accepts an Address-like object', () => {
    const conn = makeConnection({ mailFrom: { address: 'sender@example.com' } })
    assert.equal(conn.transaction.mail_from.address, 'sender@example.com')
  })

  it('rcptTo coerces an array of strings to Address objects', () => {
    const conn = makeConnection({ rcptTo: ['a@example.com', 'b@example.com'] })
    assert.equal(conn.transaction.rcpt_to.length, 2)
    assert.equal(conn.transaction.rcpt_to[0].address, 'a@example.com')
    assert.equal(conn.transaction.rcpt_to[1].address, 'b@example.com')
  })

  it('txNotes seeds transaction.notes', () => {
    const conn = makeConnection({ txNotes: { spamd_user: 'tx' } })
    assert.ok(conn.transaction)
    assert.equal(conn.transaction.notes.spamd_user, 'tx')
  })
})

describe('makePlugin with configDir', () => {
  it('points plugin.config at a custom directory', () => {
    const plugin = makePlugin(path.join('test', 'fixtures', 'hook-plugin'), {
      configDir: path.join(__dirname, 'fixtures'),
    })
    assert.ok(plugin.config)
    // module_config returns a config object with a different root than the default
    assert.equal(typeof plugin.config.get, 'function')
  })

  it('still calls register() with configDir', () => {
    const plugin = makePlugin(path.join('test', 'fixtures', 'hook-plugin'), {
      configDir: path.join(__dirname, 'fixtures'),
    })
    assert.ok(plugin.hooks.rcpt)
  })
})

describe('getResult', () => {
  it('returns result by plugin name string', () => {
    const conn = makeConnection()
    conn.results.add({ name: 'my-plugin' }, { pass: 'token' })
    const r = getResult(conn, 'my-plugin')
    assert.ok(r.pass.includes('token'))
  })

  it('returns result by plugin instance', () => {
    const conn = makeConnection()
    const plugin = makePlugin(path.join('test', 'fixtures', 'hook-plugin'))
    conn.results.add(plugin, { pass: 'ok' })
    const r = getResult(conn, plugin)
    assert.ok(r.pass.includes('ok'))
  })

  it('returns empty result object when plugin has no results yet', () => {
    const conn = makeConnection()
    const r = getResult(conn, 'nonexistent')
    assert.deepEqual(r.pass, [])
    assert.deepEqual(r.fail, [])
    assert.deepEqual(r.skip, [])
    assert.deepEqual(r.err, [])
  })
})
