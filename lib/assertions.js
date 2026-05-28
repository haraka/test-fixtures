'use strict'

const assert = require('node:assert/strict')

const constants = require('haraka-constants')

const denyCodes = new Set([constants.deny, constants.denysoft, constants.denydisconnect, constants.denysoftdisconnect])

// Accept either a raw rc value or the {rc, msg} result object returned by
// callXxx helpers, so callers can write either:
//   const r = await callMail(...);  assertDeny(r, /pattern/)
//   const { rc } = await callMail(...);  assertDeny(rc)
const split = (rcOrResult) => {
  if (rcOrResult && typeof rcOrResult === 'object' && 'rc' in rcOrResult) {
    return { rc: rcOrResult.rc, msg: rcOrResult.msg }
  }
  return { rc: rcOrResult, msg: undefined }
}

const matchMsg = (msg, expected) => {
  if (expected === undefined) return
  const haystack = String(msg ?? '')
  if (expected instanceof RegExp) assert.match(haystack, expected)
  else assert.ok(haystack.includes(expected), `expected msg to include '${expected}', got '${haystack}'`)
}

/**
 * Assert the hook continued (no return code, or explicit CONT).
 *
 *   assertCont(rc)
 *   assertCont(result)
 */
exports.assertCont = (rcOrResult) => {
  const { rc } = split(rcOrResult)
  if (rc !== undefined && rc !== constants.cont) {
    assert.fail(`expected CONT (or undefined), got ${rc}`)
  }
}

/**
 * Assert the hook returned OK. Optional msg matcher.
 *
 *   assertOk(rc)
 *   assertOk(result)
 *   assertOk(result, /accepted/)
 */
exports.assertOk = (rcOrResult, msgMatcher) => {
  const { rc, msg } = split(rcOrResult)
  assert.equal(rc, constants.ok, `expected OK, got ${rc}`)
  matchMsg(msg, msgMatcher)
}

/**
 * Assert the hook denied. By default accepts any DENY* code; pass a
 * specific code (DENY, DENYSOFT, DENYDISCONNECT, DENYSOFTDISCONNECT)
 * to require an exact match.
 *
 *   assertDeny(rc)
 *   assertDeny(result)
 *   assertDeny(result, /no thanks/)
 *   assertDeny(result, /no thanks/, DENYSOFT)
 */
exports.assertDeny = (rcOrResult, msgMatcher, code) => {
  const { rc, msg } = split(rcOrResult)
  if (code !== undefined) {
    assert.equal(rc, code, `expected code ${code}, got ${rc}`)
  } else if (!denyCodes.has(rc)) {
    assert.fail(`expected a DENY* code, got ${rc}`)
  }
  matchMsg(msg, msgMatcher)
}

/**
 * Assert that connection.results.get(plugin)[kind] contains an entry
 * matching `matcher` (string substring or RegExp). Without a matcher,
 * just asserts the bucket is non-empty.
 *
 *   assertResult(conn, plugin, 'pass')
 *   assertResult(conn, plugin, 'pass', /^connect:/)
 *   assertResult(conn, 'access', 'fail', 'blacklist')
 */
exports.assertResult = (connection, pluginOrName, kind, matcher) => {
  const name = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name
  const result = connection.results.get(name)
  assert.ok(result, `no results for plugin '${name}'`)
  const bucket = result[kind]
  assert.ok(Array.isArray(bucket), `result kind '${kind}' is not an array on plugin '${name}'`)
  if (matcher === undefined) {
    assert.ok(bucket.length, `expected results.${kind} to be non-empty for plugin '${name}'`)
    return
  }
  const found = bucket.some((entry) =>
    matcher instanceof RegExp ? matcher.test(String(entry)) : String(entry).includes(matcher),
  )
  assert.ok(
    found,
    `no entry matching ${matcher} in results.${kind} for plugin '${name}' (got: ${JSON.stringify(bucket)})`,
  )
}
