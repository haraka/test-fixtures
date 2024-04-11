const assert = require('assert')

const connection = require('../lib/connection')
// console.log(connection);

describe('basic', function () {
  it('is a function', () => {
    assert.equal(typeof connection.Connection, 'function')
  })

  it('createConnection', () => {
    assert.equal(typeof connection.createConnection, 'function')
  })
})

describe('connection', function () {
  beforeEach((done) => {
    this.connection = connection.createConnection()
    done()
  })

  it('creates a new connection', () => {
    assert.ok(this.connection)
  })

  it('creates a new transaction', () => {
    this.connection.init_transaction()
    assert.ok(this.connection.transaction)
  })

  it('remote', () => {
    assert.deepEqual(this.connection.remote, {
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
    assert.deepEqual(this.connection.local, {
      host: 'haraka-test.example.com',
      info: 'Haraka',
      ip: null,
      port: null,
    })
  })

  it('hello', () => {
    assert.deepEqual(this.connection.hello, {
      host: null,
      verb: null,
    })
  })

  it('tls', () => {
    assert.deepEqual(this.connection.tls, {
      advertised: false,
      cipher: {},
      enabled: false,
      verified: false,
    })
  })

  it('notes', () => {
    assert.deepEqual(this.connection.notes, {})
  })

  it('set', () => {
    this.connection.set('remote', 'ip', '192.168.1.1')
    assert.deepEqual(this.connection.remote.ip, '192.168.1.1')
  })

  it('get', () => {
    this.connection.set('remote', 'ip', '192.168.1.1')
    assert.equal(this.connection.get('remote.ip'), '192.168.1.1')
  })
})
