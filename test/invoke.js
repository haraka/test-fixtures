'use strict'

const assert = require('node:assert/strict')
const { describe, it } = require('node:test')

const constants = require('haraka-constants')

const { invoke, normalize } = require('../lib/invoke')

describe('invoke', () => {
  it('resolves with {rc, msg} from a callback-style hook', async () => {
    const plugin = {
      hook: (next, conn, params) => next(params[0], params[1]),
    }
    const r = await invoke(plugin, 'hook', {}, [constants.deny, 'no thanks'])
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'no thanks')
  })

  it('resolves with undefined when callback fires with no args', async () => {
    const plugin = { hook: (next) => next() }
    const r = await invoke(plugin, 'hook', {})
    assert.equal(r.rc, undefined)
    assert.equal(r.msg, undefined)
  })

  it('resolves from an async hook returning a constant', async () => {
    const plugin = { hook: async () => constants.deny }
    const r = await invoke(plugin, 'hook', {})
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, undefined)
  })

  it('resolves from an async hook returning {rc, msg}', async () => {
    const plugin = { hook: async () => ({ rc: constants.denysoft, msg: 'later' }) }
    const r = await invoke(plugin, 'hook', {})
    assert.equal(r.rc, constants.denysoft)
    assert.equal(r.msg, 'later')
  })

  it('resolves from an async hook returning [rc, msg]', async () => {
    const plugin = { hook: async () => [constants.deny, 'array form'] }
    const r = await invoke(plugin, 'hook', {})
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'array form')
  })

  it('resolves from an async hook returning undefined (CONT)', async () => {
    const plugin = { hook: async () => undefined }
    const r = await invoke(plugin, 'hook', {})
    assert.equal(r.rc, undefined)
    assert.equal(r.msg, undefined)
  })

  it('rejects when the hook throws synchronously', async () => {
    const plugin = {
      hook: () => {
        throw new Error('boom')
      },
    }
    await assert.rejects(invoke(plugin, 'hook', {}), /boom/)
  })

  it('rejects when an async hook rejects', async () => {
    const plugin = {
      hook: async () => {
        throw new Error('async boom')
      },
    }
    await assert.rejects(invoke(plugin, 'hook', {}), /async boom/)
  })

  it('ignores duplicate next() calls (first one wins)', async () => {
    const plugin = {
      hook: (next) => {
        next(constants.deny, 'first')
        next(constants.ok, 'second') // ignored
      },
    }
    const r = await invoke(plugin, 'hook', {})
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'first')
  })
})

describe('normalize', () => {
  it('treats undefined as CONT', () => {
    assert.deepEqual(normalize(undefined), { rc: undefined, msg: undefined })
  })
  it('treats null as CONT', () => {
    assert.deepEqual(normalize(null), { rc: undefined, msg: undefined })
  })
  it('unwraps {rc, msg} objects', () => {
    assert.deepEqual(normalize({ rc: 902, msg: 'no' }), { rc: 902, msg: 'no' })
  })
  it('unwraps [rc, msg] arrays', () => {
    assert.deepEqual(normalize([903, 'soft']), { rc: 903, msg: 'soft' })
  })
  it('treats a bare number as rc', () => {
    assert.deepEqual(normalize(902), { rc: 902, msg: undefined })
  })
})
