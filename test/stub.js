'use strict'

const assert = require('assert')

const fixtures = require('../lib/stub')

describe('stub', function () {
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
})
