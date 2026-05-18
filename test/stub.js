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
})
