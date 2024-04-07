const assert = require('assert')

const connection = require('../lib/connection')
// console.log(connection);

describe('basic', function () {
  it('is a function', (done) => {
    assert.equal(typeof connection.Connection, 'function')
    done()
  })
  it('createConnection', (done) => {
    assert.equal(typeof connection.createConnection, 'function')
    done()
  })
})

describe('connection', function () {
  beforeEach((done) => {
    this.connection = connection.createConnection()
    done()
  })
  it('creates a new connection', (done) => {
    assert.ok(this.connection)
    done()
  })
  it('creates a new transaction', (done) => {
    this.connection.init_transaction()
    assert.ok(this.connection.transaction)
    done()
  })
  it('remote.ip', (done) => {
    assert.equal(this.connection.remote.ip, '127.0.0.1')
    done()
  })
  it('local', (done) => {
    assert.deepEqual(this.connection.local, {})
    done()
  })
  it('hello', (done) => {
    assert.deepEqual(this.connection.hello, {})
    done()
  })
  it('tls', (done) => {
    assert.deepEqual(this.connection.tls, {})
    done()
  })
  it('notes', (done) => {
    assert.deepEqual(this.connection.notes, {})
    done()
  })
  it('set', (done) => {
    this.connection.set('remote', 'ip', '192.168.1.1')
    assert.deepEqual(this.connection.remote.ip, '192.168.1.1')
    done()
  })
})
