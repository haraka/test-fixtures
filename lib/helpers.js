'use strict'

const path = require('node:path')

const { Address } = require('@haraka/email-address')

const Plugin = require('./plugin')
const { createConnection } = require('./connection')

const toAddress = (v) => {
  if (v instanceof Address) return v
  if (typeof v === 'string') return new Address(v.startsWith('<') ? v : `<${v}>`)
  if (v && typeof v === 'object' && v.address) return new Address(`<${v.address}>`)
  return v
}

/**
 * Wraps a Haraka hook callback into an awaitable Promise.
 *
 * Haraka hooks follow the convention: plugin.method(next, connection, ...args)
 * where next is called as next(rc, msg).  This helper turns that into:
 *
 *   const { rc, msg } = await callHook(plugin, 'bare_ip', connection, 'helo')
 *
 * Prefer the typed call helpers (callMail, callRcpt, etc.) when possible —
 * they're more readable and resolve the method name automatically. Use this
 * generic version for hooks without a typed wrapper, or to call a specific
 * method directly.
 *
 * @param {object} plugin   - Plugin instance
 * @param {string} method   - Hook method name (e.g. 'hook_rcpt', 'bare_ip')
 * @param {object} connection
 * @param {...*}   args     - Additional hook arguments (params, helo host, etc.)
 * @returns {Promise<{rc: *, msg: *}>}
 */
const { invoke } = require('./invoke')

exports.callHook = (plugin, method, connection, ...args) => invoke(plugin, method, connection, ...args)

/**
 * Creates, optionally registers, and returns a Plugin instance.
 *
 *   const plugin = makePlugin('helo.checks')
 *   const plugin = makePlugin('access', { configDir: __dirname })
 *
 * @param {string}  name
 * @param {object}  [opts]
 * @param {boolean} [opts.register=true]  - call plugin.register() after creation
 * @param {string}  [opts.configDir]      - resolve to plugin.config.module_config(path.resolve(configDir))
 *                                          *before* register() runs
 * @returns {Plugin}
 */
exports.makePlugin = (name, { register = true, configDir } = {}) => {
  const plugin = new Plugin(name)
  if (configDir) plugin.config = plugin.config.module_config(path.resolve(configDir))
  if (register) plugin.register()
  return plugin
}

/**
 * Creates a Connection with commonly-needed options pre-applied.
 *
 *   const conn = makeConnection({ ip: '1.2.3.4', mailFrom: 'user@host' })
 *
 * If mailFrom, rcptTo, or txNotes is given, a transaction is created
 * automatically (no need to pass withTxn).
 *
 * @param {object}  [opts]
 * @param {string}  [opts.ip='127.0.0.1']        - remote.ip
 * @param {boolean} [opts.withTxn=false] - call init_transaction()
 * @param {boolean} [opts.relaying=false]        - connection._relaying
 * @param {string}  [opts.helo]                  - hello.host (EHLO hostname)
 * @param {string|Address}        [opts.mailFrom] - transaction.mail_from (string coerced to Address)
 * @param {Array<string|Address>} [opts.rcptTo]   - transaction.rcpt_to (strings coerced to Address)
 * @param {object}  [opts.notes]                 - seed connection.notes
 * @param {object}  [opts.txNotes]               - seed transaction.notes
 * @returns {Connection}
 */
exports.makeConnection = ({
  ip = '127.0.0.1',
  withTxn = false,
  relaying = false,
  helo,
  mailFrom,
  rcptTo,
  notes,
  txNotes,
} = {}) => {
  const conn = createConnection()
  conn.remote.ip = ip
  conn._relaying = relaying
  if (helo) {
    conn.hello.host = helo
    conn.hello.verb = 'EHLO'
  }
  if (notes) Object.assign(conn.notes, notes)

  const needTransaction = withTxn || mailFrom || rcptTo || txNotes
  if (needTransaction) conn.init_transaction()
  if (mailFrom) conn.transaction.mail_from = toAddress(mailFrom)
  if (rcptTo) conn.transaction.rcpt_to = rcptTo.map(toAddress)
  if (txNotes) Object.assign(conn.transaction.notes, txNotes)

  return conn
}

/**
 * Returns the result-store entry for a plugin, accepting either the plugin
 * instance or its string name.  Falls back to an empty result object so
 * callers can write `getResult(conn, plugin).pass.length` without null checks.
 *
 *   const r = getResult(connection, plugin)
 *   assert.ok(r.pass.length)
 *
 * @param {object}        connection
 * @param {object|string} pluginOrName
 * @returns {{ pass: string[], fail: string[], skip: string[], err: string[], data: object }}
 */
exports.getResult = (connection, pluginOrName) => {
  const name = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name
  return connection.results.get(name) ?? { pass: [], fail: [], skip: [], err: [], data: {} }
}
