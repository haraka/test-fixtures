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
})
