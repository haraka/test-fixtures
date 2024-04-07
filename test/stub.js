'use strict'

const assert = require('assert')

const fixtures = require('../lib/stub')

describe('stub', function () {
  it('is a function', (done) => {
    assert.equal(typeof fixtures.stub, 'function')
    done()
  })

  it('returns a function', (done) => {
    const stub = new fixtures.stub()
    assert.equal(typeof stub, 'function')
    done()
  })

  it('indicates when has been called', (done) => {
    const stub = new fixtures.stub()
    assert.equal(stub.called, false)
    stub()
    assert.equal(stub.called, true)
    done()
  })
})
