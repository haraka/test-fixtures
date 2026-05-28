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
    const r = await invoke(plugin, 'hook', [{}, [constants.deny, 'no thanks']])
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'no thanks')
  })

  it('resolves with undefined when callback fires with no args', async () => {
    const plugin = { hook: (next) => next() }
    const r = await invoke(plugin, 'hook', [{}])
    assert.equal(r.rc, undefined)
    assert.equal(r.msg, undefined)
  })

  it('routes a 3.x async hook (next, conn) through the callback path', async () => {
    // arity 2: matches a 3.x signature `async (next, connection)`. The
    // dispatcher must NOT treat this as 4.0, even though it's async.
    const plugin = {
      hook: async function (next, conn) {
        await Promise.resolve()
        next(constants.deny, 'still 3.x')
      },
    }
    // asyncArity 1 says "4.0 would be arity 1 here". The hook is arity 2,
    // so it's 3.x and gets `next` injected.
    const r = await invoke(plugin, 'hook', [{}], { asyncArity: 1 })
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'still 3.x')
  })

  it('routes a 4.0 async hook (conn) without injecting next', async () => {
    const plugin = {
      hook: async function (conn) {
        return constants.deny
      },
    }
    const r = await invoke(plugin, 'hook', [{}], { asyncArity: 1 })
    assert.equal(r.rc, constants.deny)
  })

  it('resolves from a 4.0 async hook returning {rc, msg}', async () => {
    const plugin = { hook: async (c) => ({ rc: constants.denysoft, msg: 'later' }) }
    const r = await invoke(plugin, 'hook', [{}], { asyncArity: 1 })
    assert.equal(r.rc, constants.denysoft)
    assert.equal(r.msg, 'later')
  })

  it('resolves from a 4.0 async hook returning [rc, msg]', async () => {
    const plugin = { hook: async (c) => [constants.deny, 'array form'] }
    const r = await invoke(plugin, 'hook', [{}], { asyncArity: 1 })
    assert.equal(r.rc, constants.deny)
    assert.equal(r.msg, 'array form')
  })

  it('resolves from a 4.0 async hook returning undefined (CONT)', async () => {
    const plugin = { hook: async (c) => undefined }
    const r = await invoke(plugin, 'hook', [{}], { asyncArity: 1 })
    assert.equal(r.rc, undefined)
    assert.equal(r.msg, undefined)
  })

  it('without asyncArity hint, async hooks default to callback dispatch', async () => {
    // Defensive: when no asyncArity is supplied (generic callHook), the
    // dispatcher assumes 3.x callback style and injects next. The hook here
    // is async-declared but still expects next.
    const plugin = {
      hook: async function (next, conn) {
        next(constants.ok, 'callback path')
      },
    }
    const r = await invoke(plugin, 'hook', [{}])
    assert.equal(r.rc, constants.ok)
    assert.equal(r.msg, 'callback path')
  })

  it('rejects when the hook throws synchronously', async () => {
    const plugin = {
      hook: () => {
        throw new Error('boom')
      },
    }
    await assert.rejects(invoke(plugin, 'hook', [{}]), /boom/)
  })

  it('rejects when a 4.0 async hook rejects', async () => {
    const plugin = {
      hook: async (conn) => {
        throw new Error('async boom')
      },
    }
    await assert.rejects(invoke(plugin, 'hook', [{}], { asyncArity: 1 }), /async boom/)
  })

  it('ignores duplicate next() calls (first one wins)', async () => {
    const plugin = {
      hook: (next) => {
        next(constants.deny, 'first')
        next(constants.ok, 'second')
      },
    }
    const r = await invoke(plugin, 'hook', [{}])
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
