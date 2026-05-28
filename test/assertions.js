'use strict'

const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

const constants = require('haraka-constants')

const { makeConnection, assertCont, assertOk, assertDeny, assertResult } = require('../index')

describe('assertCont', () => {
  it('passes on undefined', () => {
    assertCont(undefined)
  })
  it('passes on CONT', () => {
    assertCont(constants.cont)
  })
  it('passes when given a result object', () => {
    assertCont({ rc: undefined, msg: undefined })
  })
  it('fails on a deny code', () => {
    assert.throws(() => assertCont(constants.deny), /CONT/)
  })
})

describe('assertOk', () => {
  it('passes on OK', () => {
    assertOk(constants.ok)
  })
  it('matches msg via substring', () => {
    assertOk({ rc: constants.ok, msg: 'accepted with notes' }, 'accepted')
  })
  it('matches msg via RegExp', () => {
    assertOk({ rc: constants.ok, msg: 'accepted with notes' }, /^accepted/)
  })
  it('fails on a non-OK code', () => {
    assert.throws(() => assertOk(constants.deny), /OK/)
  })
  it('fails when msg matcher does not match', () => {
    assert.throws(() => assertOk({ rc: constants.ok, msg: 'foo' }, /bar/))
  })
})

describe('assertDeny', () => {
  it('passes on DENY', () => {
    assertDeny(constants.deny)
  })
  it('passes on DENYSOFT', () => {
    assertDeny(constants.denysoft)
  })
  it('passes on DENYDISCONNECT', () => {
    assertDeny(constants.denydisconnect)
  })
  it('passes on DENYSOFTDISCONNECT', () => {
    assertDeny(constants.denysoftdisconnect)
  })
  it('checks specific code when provided', () => {
    assertDeny({ rc: constants.denysoft }, undefined, constants.denysoft)
    assert.throws(() => assertDeny({ rc: constants.deny }, undefined, constants.denysoft))
  })
  it('matches msg via RegExp', () => {
    assertDeny({ rc: constants.deny, msg: 'no thanks pal' }, /no thanks/)
  })
  it('matches msg via substring', () => {
    assertDeny({ rc: constants.deny, msg: 'no thanks pal' }, 'thanks')
  })
  it('fails on a non-deny code', () => {
    assert.throws(() => assertDeny(constants.ok), /DENY/)
  })
  it('fails when msg matcher does not match', () => {
    assert.throws(() => assertDeny({ rc: constants.deny, msg: 'foo' }, /bar/))
  })
})

describe('assertResult', () => {
  it('asserts a bucket is non-empty', () => {
    const conn = makeConnection()
    conn.results.add({ name: 'p' }, { pass: 'token' })
    assertResult(conn, 'p', 'pass')
  })

  it('asserts an entry matches a substring', () => {
    const conn = makeConnection()
    conn.results.add({ name: 'p' }, { pass: 'connect:passed' })
    assertResult(conn, 'p', 'pass', 'connect:')
  })

  it('asserts an entry matches a RegExp', () => {
    const conn = makeConnection()
    conn.results.add({ name: 'p' }, { fail: 'blacklist(spam.com)' })
    assertResult(conn, 'p', 'fail', /^blacklist/)
  })

  it('accepts a plugin instance', () => {
    const conn = makeConnection()
    const plugin = { name: 'p' }
    conn.results.add(plugin, { pass: 'ok' })
    assertResult(conn, plugin, 'pass')
  })

  it('fails when bucket is empty', () => {
    const conn = makeConnection()
    conn.results.add({ name: 'p' }, { pass: 'token' })
    assert.throws(() => assertResult(conn, 'p', 'fail'), /non-empty/)
  })

  it('fails when matcher does not match', () => {
    const conn = makeConnection()
    conn.results.add({ name: 'p' }, { pass: 'token' })
    assert.throws(() => assertResult(conn, 'p', 'pass', /nope/), /no entry matching/)
  })

  it('fails when plugin has no results', () => {
    const conn = makeConnection()
    assert.throws(() => assertResult(conn, 'p', 'pass'), /no results/)
  })
})
