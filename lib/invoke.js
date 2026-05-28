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
 * `invoke` accepts either shape and resolves with a normalized
 * `{ rc, msg }` object so tests don't care which API the plugin uses.
 */
exports.invoke = function invoke(plugin, method, ...callArgs) {
  const fn = plugin[method]
  if (typeof fn !== 'function') {
    return Promise.reject(new Error(`plugin '${plugin.name}' has no method '${method}'`))
  }

  // 4.0-style: declared `async function (connection, ...)` — no `next` arg.
  if (fn.constructor.name === 'AsyncFunction') {
    return Promise.resolve(fn.call(plugin, ...callArgs)).then(normalize)
  }

  // 3.x-style: callback. Also tolerate a non-async function that happens to
  // return a Promise (some plugins might wrap promise logic without `async`).
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    const next = (rc, msg) => finish({ rc, msg })

    let returned
    try {
      returned = fn.call(plugin, next, ...callArgs)
    } catch (err) {
      return reject(err)
    }
    if (returned && typeof returned.then === 'function') {
      returned.then((r) => finish(normalize(r)), reject)
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
