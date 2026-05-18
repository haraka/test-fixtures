'use strict'

const assert = require('node:assert/strict')
const { describe, it, beforeEach } = require('node:test')

const connection = require('../lib/connection')

describe('basic', () => {
  it('is a function', () => {
    assert.equal(typeof connection.Connection, 'function')
  })

  it('createConnection', () => {
    assert.equal(typeof connection.createConnection, 'function')
  })
})

describe('connection', () => {
  let conn

  beforeEach(() => {
    conn = connection.createConnection()
  })

  it('creates a new connection', () => {
    assert.ok(conn)
  })

  it('creates a new transaction', () => {
    conn.init_transaction()
    assert.ok(conn.transaction)
  })

  it('remote', () => {
    assert.deepEqual(conn.remote, {
      ip: '127.0.0.1',
      port: null,
      closed: false,
      host: null,
      info: null,
      is_local: false,
      is_private: false,
    })
  })

  it('local', () => {
    assert.deepEqual(conn.local, {
      host: 'haraka-test.example.com',
      info: 'Haraka',
      ip: null,
      port: null,
    })
  })

  it('hello', () => {
    assert.deepEqual(conn.hello, {
      host: null,
      verb: null,
    })
  })

  it('tls', () => {
    assert.deepEqual(conn.tls, {
      advertised: false,
      cipher: {},
      enabled: false,
      verified: false,
    })
  })

  it('notes', () => {
    // conn.notes is a Notes instance; compare its own enumerable props
    assert.deepEqual({ ...conn.notes }, { tls: {} })
  })

  it('set', () => {
    conn.set('remote', 'ip', '192.168.1.1')
    assert.deepEqual(conn.remote.ip, '192.168.1.1')
  })

  it('get', () => {
    conn.set('remote', 'ip', '192.168.1.1')
    assert.equal(conn.get('remote.ip'), '192.168.1.1')
  })

  it('set creates intermediate objects for a dotted path', () => {
    conn.set('a.b.c', 'deep')
    assert.equal(conn.get('a.b.c'), 'deep')
  })

  it('set ignores __proto__ / constructor (no prototype pollution)', () => {
    conn.set('__proto__.polluted', 'yes')
    conn.set('constructor.prototype.polluted', 'yes')
    assert.equal({}.polluted, undefined)
  })

  it('get returns undefined for a missing path', () => {
    assert.equal(conn.get('no.such.path'), undefined)
  })
})

// Plugins branch on connection.relaying constantly (inbound vs outbound).
// The getter prefers the transaction's value when one exists.
describe('relaying', () => {
  let conn

  beforeEach(() => {
    conn = connection.createConnection()
  })

  it('defaults to false', () => {
    assert.equal(conn.relaying, false)
  })

  it('set without a transaction is stored on the connection', () => {
    conn.relaying = true
    assert.equal(conn.relaying, true)
  })

  it('set with a transaction is scoped to the transaction', () => {
    conn.init_transaction()
    conn.relaying = true
    assert.equal(conn.relaying, true)
    assert.equal(conn.transaction._relaying, true)
  })

  it('transaction value overrides the connection value', () => {
    conn.relaying = true
    conn.init_transaction()
    conn.relaying = false
    assert.equal(conn.relaying, false)
  })
})

describe('transaction lifecycle', () => {
  let conn

  beforeEach(() => {
    conn = connection.createConnection()
  })

  it('init_transaction invokes the done callback', () => {
    let called = false
    conn.init_transaction(() => {
      called = true
    })
    assert.ok(conn.transaction)
    assert.ok(conn.transaction.results)
    assert.equal(called, true)
  })

  it('reset_transaction marks resetting, then clears', () => {
    conn.init_transaction()
    conn.transaction.resetting = false
    conn.reset_transaction()
    assert.equal(conn.transaction.resetting, true)
    conn.reset_transaction()
    assert.equal(conn.transaction, null)
  })

  it('disconnect drops the transaction', () => {
    conn.init_transaction()
    conn.disconnect()
    assert.equal(conn.transaction, null)
  })
})

describe('capabilities & TLS', () => {
  let conn

  beforeEach(() => {
    conn = connection.createConnection()
  })

  it('get_capabilities includes PIPELINING and SIZE', () => {
    const caps = conn.get_capabilities()
    assert.ok(caps.includes('PIPELINING'))
    assert.ok(caps.some((c) => c.startsWith('SIZE ')))
  })

  it('setTLS enables tls and copies cipher/verified', () => {
    conn.setTLS({ cipher: { name: 'TLS_AES' }, verified: true })
    assert.equal(conn.tls.enabled, true)
    assert.deepEqual(conn.tls.cipher, { name: 'TLS_AES' })
    assert.equal(conn.tls.verified, true)
  })
})

// Hook responder methods are used by integration-style plugin tests to
// drive the mail/rcpt/data flow and record results + counts.
describe('hook responders', () => {
  const { Address } = require('@haraka/email-address')
  let conn

  beforeEach(() => {
    conn = connection.createConnection()
    conn.init_transaction()
    conn.transaction.mail_from = new Address('<sender@example.com>')
  })

  it('mail_respond accept records an accept result (no throw)', () => {
    conn.mail_respond('cont')
    const res = conn.transaction.results.get('mail_from')
    assert.equal(res.action, 'accept')
    assert.equal(res.address, 'sender@example.com')
  })

  it('mail_respond deny records a reject result', () => {
    conn.mail_respond('deny')
    assert.equal(conn.transaction.results.get('mail_from').action, 'reject')
  })

  it('mail_respond denysoft records a tempfail result', () => {
    conn.mail_respond('denysoft')
    assert.equal(conn.transaction.results.get('mail_from').action, 'tempfail')
  })

  it('rcpt_ok_respond accept increments counts and records the rcpt', () => {
    conn.transaction.rcpt_to.push(new Address('<rcpt@example.com>'))
    conn.rcpt_ok_respond('cont')
    assert.equal(conn.transaction.rcpt_count.accept, 1)
    assert.equal(conn.rcpt_count.accept, 1)
    const res = conn.transaction.results.get('rcpt_to')
    assert.equal(res.recipient[0].address, 'rcpt@example.com')
    assert.equal(res.recipient[0].action, 'accept')
  })

  it('rcpt_respond ok stashes the message for rcpt_ok_respond', () => {
    conn.transaction.rcpt_to.push(new Address('<rcpt@example.com>'))
    conn.rcpt_respond('ok', 'queued msg')
    assert.equal(conn.last_rcpt_msg, 'queued msg')
  })

  it('rcpt_respond default rejects and pops the recipient', () => {
    conn.transaction.rcpt_to.push(new Address('<rcpt@example.com>'))
    conn.rcpt_respond(undefined)
    assert.equal(conn.transaction.rcpt_count.reject, 1)
    assert.equal(conn.transaction.rcpt_to.length, 0)
  })

  it('data_respond accept advances to DATA state', () => {
    conn.data_respond('cont')
    assert.equal(conn.transaction.data_bytes, 0)
  })

  it('data_respond deny resets the transaction', () => {
    conn.transaction.resetting = false
    conn.data_respond('deny')
    assert.equal(conn.transaction.resetting, true)
  })
})
