'use strict'

const { Address } = require('@haraka/email-address')

const { invoke } = require('./invoke')

/**
 * Typed per-hook helpers.
 *
 *   const { rc, msg } = await callMail(plugin, conn, 'user@host')
 *
 * Each helper:
 *   - takes natural args (string addresses, not [new Address('<x>'), {}])
 *   - resolves method name from plugin.hooks[hookName] when possible
 *   - returns Promise<{rc, msg}> via the dual-mode invoke() dispatcher
 *
 * For plugins that export the hook method under a non-default name
 * (e.g. access/rdns_access for the 'connect' hook), the helper finds it
 * via plugin.hooks (populated by register_hook). Callers can also pass
 * an explicit method name as the last argument when they need to bypass
 * the registry — useful for plugins that expose multiple methods on
 * one hook (priority ordering, etc.).
 */

const resolveMethod = (plugin, hookName, explicit) => {
  if (explicit) return explicit
  const registered = plugin.hooks?.[hookName]
  if (registered && registered.length) return registered[0]
  for (const name of [`hook_${hookName}`, hookName]) {
    if (typeof plugin[name] === 'function') return name
  }
  throw new Error(
    `no method on plugin '${plugin.name}' for hook '${hookName}' (looked at plugin.hooks, hook_${hookName}, ${hookName})`,
  )
}

const toAddress = (v) => {
  if (v instanceof Address) return v
  if (typeof v === 'string') return new Address(v.startsWith('<') ? v : `<${v}>`)
  if (v && typeof v === 'object' && v.address) return new Address(`<${v.address}>`)
  return v
}

const noArg = (hookName) => (plugin, conn, method) => invoke(plugin, resolveMethod(plugin, hookName, method), conn)

const stringArg = (hookName) => (plugin, conn, arg, method) =>
  invoke(plugin, resolveMethod(plugin, hookName, method), conn, arg)

const addressArg = (hookName) => (plugin, conn, addr, params, method) =>
  invoke(plugin, resolveMethod(plugin, hookName, method), conn, [toAddress(addr), params ?? {}])

exports.callConnect = noArg('connect')
exports.callHelo = stringArg('helo')
exports.callEhlo = stringArg('ehlo')
exports.callMail = addressArg('mail')
exports.callRcpt = addressArg('rcpt')
exports.callRcptOk = (plugin, conn, rcpt, method) =>
  invoke(plugin, resolveMethod(plugin, 'rcpt_ok', method), conn, toAddress(rcpt))
exports.callData = noArg('data')
exports.callDataPost = noArg('data_post')
exports.callQueue = noArg('queue')
exports.callQueueOk = (plugin, conn, msg, method) =>
  invoke(plugin, resolveMethod(plugin, 'queue_ok', method), conn, msg)
exports.callDisconnect = noArg('disconnect')

exports.resolveMethod = resolveMethod
exports.toAddress = toAddress
