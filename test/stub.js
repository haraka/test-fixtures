'use strict'

const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

const fixtures = require('../lib/stub')

describe('stub', () => {
  it('is a function', () => {
    assert.equal(typeof fixtures.stub, 'function')
  })

  it('returns a function', () => {
    const stub = new fixtures.stub()
    assert.equal(typeof stub, 'function')
  })

  it('indicates when has been called', () => {
    const stub = new fixtures.stub()
    assert.equal(stub.called, false)
    stub()
    assert.equal(stub.called, true)
  })

  it('returns the configured return value', () => {
    const stub = fixtures.stub('RET')
    assert.equal(stub(), 'RET')
  })

  // Plugins use fixtures.stub as a `next` callback and inspect args
  // across multiple invocations (e.g. next() called more than once).
  it('accumulates args across calls', () => {
    const stub = fixtures.stub()
    stub('first')
    assert.equal(stub.args[0], 'first') // single call: args = arguments

    stub('second')
    // second call: args becomes [arguments, arguments]
    assert.equal(stub.args[0][0], 'first')
    assert.equal(stub.args[1][0], 'second')

    stub('third')
    // third+ call: pushed onto the array
    assert.equal(stub.args[2][0], 'third')
  })
})
