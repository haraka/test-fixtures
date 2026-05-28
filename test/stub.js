'use strict'

const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

const { stub } = require('../lib/stub')

describe('stub', () => {
  it('is a function', () => {
    assert.equal(typeof stub, 'function')
  })

  it('returns a function', () => {
    const s = stub()
    assert.equal(typeof s, 'function')
  })

  it('starts uncalled', () => {
    const s = stub()
    assert.equal(s.called, false)
    assert.equal(s.callCount, 0)
    assert.deepEqual(s.calls, [])
    assert.equal(s.args, undefined)
  })

  it('sets called=true on first invocation', () => {
    const s = stub()
    assert.equal(s.called, false)
    s()
    assert.equal(s.called, true)
  })

  it('returns the configured return value', () => {
    const s = stub('RET')
    assert.equal(s(), 'RET')
  })

  it('tracks callCount', () => {
    const s = stub()
    s()
    s()
    s()
    assert.equal(s.callCount, 3)
  })

  it('args reflects the most recent call', () => {
    const s = stub()
    s('first', 1)
    assert.deepEqual(s.args, ['first', 1])
    s('second', 2)
    assert.deepEqual(s.args, ['second', 2])
  })

  it('calls contains every invocation as a plain array', () => {
    const s = stub()
    s('a')
    s('b', 'c')
    assert.equal(s.calls.length, 2)
    assert.deepEqual(s.calls[0], ['a'])
    assert.deepEqual(s.calls[1], ['b', 'c'])
  })

  it('reset() clears all tracking state', () => {
    const s = stub()
    s('x')
    s.reset()
    assert.equal(s.called, false)
    assert.equal(s.callCount, 0)
    assert.deepEqual(s.calls, [])
    assert.equal(s.args, undefined)
  })

  it('reset() allows re-use across beforeEach blocks', () => {
    const s = stub()
    s('before-reset')
    s.reset()
    s('after-reset')
    assert.equal(s.callCount, 1)
    assert.deepEqual(s.args, ['after-reset'])
  })
})
