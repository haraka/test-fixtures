const assert = require('assert')
const path = require('path')

const fixtures = require('../index')

describe('test-fixtures', function () {
  it('stub', () => {
    assert.equal('function', typeof fixtures.stub.stub)
  })

  it('logger', () => {
    assert.equal('function', typeof fixtures.logger.loginfo)
  })

  it('connection', () => {
    assert.equal('function', typeof fixtures.connection.createConnection)
  })

  it('transaction', () => {
    assert.equal('function', typeof fixtures.transaction.createTransaction)
  })

  it('line_socket', () => {
    assert.equal('function', typeof fixtures.line_socket.connect)
  })

  it('plugin', () => {
    const p = new fixtures.plugin(path.join('test', 'fixtures', 'mock-plugin'))
    assert.equal('function', typeof p.load_plugin)
  })

  it('result_store', () => {
    const rs = new fixtures.result_store()
    // console.log(rs);
    assert.equal('function', typeof rs.add)
  })

  it('util_hmailitem', () => {
    assert.equal('function', typeof fixtures.util_hmailitem.newMockHMailItem)
  })

  it('vm_harness', () => {
    assert.equal('function', typeof fixtures.vm_harness.sandbox_require)
  })
})
