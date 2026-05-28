'use strict'

/**
 * Dual-mode hook dispatcher.
 *
 * Haraka 3.x plugin hooks are callback-style:
 *
 *   exports.hook_mail = function (next, connection, params) {
 *     next(DENY, 'no thanks')
 *   }
 *
 * Haraka 4.0 plan an async/return-value style:
 *
 *   exports.hook_mail = async function (connection, params) {
 *     return [DENY, 'no thanks']        // or { rc: DENY, msg: '...' } or just DENY
 *   }
 *
 * `invoke` accepts either shape. The 4.0 path is taken only when the function
 * is `async` AND its declared arity matches the expected 4.0 arity for the
 * hook (supplied by the typed call<Hook> helpers). This distinguishes a
 * genuine 4.0 hook from a 3.x callback hook that happens to be declared
 * `async` so it can `await` internally before invoking `next`.
 */
exports.invoke = function invoke(plugin, method, callArgs, opts = {}) {
  const fn = plugin[method]
  if (typeof fn !== 'function') {
    return Promise.reject(new Error(`plugin '${plugin.name}' has no method '${method}'`))
  }

  const isAsync = fn.constructor.name === 'AsyncFunction'
  const is40 = isAsync && opts.asyncArity !== undefined && fn.length === opts.asyncArity

  if (is40) {
    return Promise.resolve(fn.call(plugin, ...callArgs)).then(normalize)
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const next = (rc, msg) => {
      if (settled) return
      settled = true
      resolve({ rc, msg })
    }
    try {
      fn.call(plugin, next, ...callArgs)
    } catch (err) {
      reject(err)
    }
  })
}

function normalize(value) {
  if (value === undefined || value === null) return { rc: undefined, msg: undefined }
  if (Array.isArray(value)) return { rc: value[0], msg: value[1] }
  if (typeof value === 'object' && 'rc' in value) return { rc: value.rc, msg: value.msg }
  return { rc: value, msg: undefined }
}

exports.normalize = normalize
