// install haraka-constants globals (OK, DENY, DENYSOFT, ...) on require so
// test files can reference them at module top-level (e.g. inside a `cases`
// table) without first constructing a Plugin.
require('haraka-constants').import(global)

exports.results = require('haraka-results')
exports.result_store = exports.results

exports.connection = require('./lib/connection')
exports.dns = require('./lib/dns')
exports.helpers = require('./lib/helpers')
exports.hooks = require('./lib/hooks')
exports.assertions = require('./lib/assertions')
exports.line_socket = require('./lib/line_socket')
exports.logger = require('./lib/logger')
exports.plugin = require('./lib/plugin')
exports.stub = require('./lib/stub')
exports.transaction = require('./lib/transaction')
exports.util_hmailitem = require('./lib/util_hmailitem')

// Named re-exports of the most-used helpers for convenient destructuring:
//   const { callMail, makePlugin, makeConnection, assertDeny } = require('haraka-test-fixtures')
const { callHook, makePlugin, makeConnection, getResult } = exports.helpers
exports.callHook = callHook
exports.makePlugin = makePlugin
exports.makeConnection = makeConnection
exports.getResult = getResult

const {
  callConnect,
  callHelo,
  callEhlo,
  callMail,
  callRcpt,
  callRcptOk,
  callData,
  callDataPost,
  callQueue,
  callQueueOk,
  callDisconnect,
} = exports.hooks
exports.callConnect = callConnect
exports.callHelo = callHelo
exports.callEhlo = callEhlo
exports.callMail = callMail
exports.callRcpt = callRcpt
exports.callRcptOk = callRcptOk
exports.callData = callData
exports.callDataPost = callDataPost
exports.callQueue = callQueue
exports.callQueueOk = callQueueOk
exports.callDisconnect = callDisconnect

const { assertCont, assertOk, assertDeny, assertResult } = exports.assertions
exports.assertCont = assertCont
exports.assertOk = assertOk
exports.assertDeny = assertDeny
exports.assertResult = assertResult
