[![Test][ci-img]][ci-url] [![Cover][cov-img]][cov-url] [![Qlty][qlty-img]][qlty-url]

# haraka-test-fixtures

Fixtures for testing Haraka and plugins

## Usage

```js
const fixtures = require('haraka-test-fixtures')
```

### Quick-start

```js
const { beforeEach, describe, it } = require('node:test')
const { makePlugin, makeConnection, callMail, callRcpt, assertDeny, assertResult } = require('haraka-test-fixtures')

describe('my-plugin', () => {
  let plugin, conn

  beforeEach(() => {
    plugin = makePlugin('my-plugin', { configDir: __dirname })
    conn = makeConnection({ ip: '1.2.3.4', mailFrom: 'sender@example.com' })
  })

  it('rejects relay attempts', async () => {
    const r = await callRcpt(plugin, conn, 'rcpt@other.com')
    assertDeny(r, /relay/)
    assertResult(conn, plugin, 'fail', /^no_relay/)
  })
})
```

That's the whole pattern: `makePlugin` + `makeConnection` + a typed `call<Hook>` +
optional `assert<...>` helpers. Compose into domain-specific helpers per test
file when it pays off (see `plugin/aliases/test/index.js` for a good example).

## Exports

- connection
- dns
- helpers, hooks, assertions _(see below)_
- line_socket
- logger
- plugin
- [results](https://github.com/haraka/haraka-results)
- stub
- transaction
- util_hmailitem

These fixtures are analogs of their like-named siblings in Haraka with varying levels of completeness. If there are functions necessary to enhance your ability to test, please do add them.

---

## helpers — `makePlugin`, `makeConnection`, `getResult`, `callHook`

### `makePlugin(name, opts?)` → Plugin

```js
makePlugin('helo.checks') // + register()
makePlugin('helo.checks', { register: false }) // skip register()
makePlugin('access', { configDir: __dirname }) // override plugin.config root
```

`configDir` runs `plugin.config.module_config(path.resolve(configDir))` _before_
`register()`, replacing the very common idiom
`plugin.config = plugin.config.module_config(path.resolve('test'))`.

### `makeConnection(opts?)` → Connection

| Option     | Default       | Description                                                                                       |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `ip`       | `'127.0.0.1'` | `remote.ip`                                                                                       |
| `relaying` | `false`       | `connection._relaying`                                                                            |
| `helo`     | _(unset)_     | sets `hello.host` + `hello.verb = 'EHLO'`                                                         |
| `withTxn`  | `false`       | calls `init_transaction()`                                                                        |
| `mailFrom` | —             | string \| Address; coerced and assigned to `transaction.mail_from`. Implies a transaction.        |
| `rcptTo`   | —             | array of string \| Address; coerced and assigned to `transaction.rcpt_to`. Implies a transaction. |
| `notes`    | —             | object merged into `connection.notes`                                                             |
| `txNotes`  | —             | object merged into `transaction.notes`. Implies a transaction.                                    |

```js
const conn = makeConnection({
  ip: '1.2.3.4',
  mailFrom: 'sender@example.com',
  rcptTo: ['rcpt@example.com'],
  txNotes: { spamd_user: 'tx' },
})
```

### `getResult(connection, pluginOrName)` → result object

Returns `connection.results.get(plugin)` with an empty-bucket fallback so callers
can read `.pass.length` etc. without null checks.

### `callHook(plugin, method, connection, ...args)` → `Promise<{rc, msg}>`

The generic Promise-wrap of a hook callback. **Prefer the typed `callXxx` helpers
below** when one fits — they're more readable and resolve the method name
automatically. Reach for `callHook` for hooks without a typed wrapper, or to
target a specific method by name.

---

## hooks — typed `call<Hook>` helpers

Each helper accepts natural args (string addresses instead of `[new Address('<x>'), {}]`),
resolves the method name automatically via `plugin.hooks[hookName]` (with `hook_<name>`
and bare `<name>` fallbacks), and returns `Promise<{rc, msg}>`.

```js
const { rc, msg } = await callMail(plugin, conn, 'sender@example.com')
const { rc } = await callRcpt(plugin, conn, 'rcpt@example.com')
const { rc } = await callConnect(plugin, conn)
const { rc } = await callHelo(plugin, conn, 'mail.example.com')
const { rc } = await callDataPost(plugin, conn)
```

| Helper                          | Hook         | Hook args                      |
| ------------------------------- | ------------ | ------------------------------ |
| `callConnect(p, c)`             | `connect`    | `(next, c)`                    |
| `callHelo(p, c, host)`          | `helo`       | `(next, c, host)`              |
| `callEhlo(p, c, host)`          | `ehlo`       | `(next, c, host)`              |
| `callMail(p, c, from, params?)` | `mail`       | `(next, c, [Address, params])` |
| `callRcpt(p, c, rcpt, params?)` | `rcpt`       | `(next, c, [Address, params])` |
| `callRcptOk(p, c, rcpt)`        | `rcpt_ok`    | `(next, c, Address)`           |
| `callData(p, c)`                | `data`       | `(next, c)`                    |
| `callDataPost(p, c)`            | `data_post`  | `(next, c)`                    |
| `callQueue(p, c)`               | `queue`      | `(next, c)`                    |
| `callQueueOk(p, c, msg)`        | `queue_ok`   | `(next, c, msg)`               |
| `callDisconnect(p, c)`          | `disconnect` | `(next, c)`                    |

All `callXxx` helpers (and `callHook`) accept an explicit method-name override as
their last argument — useful when a plugin registers multiple methods on one hook.

### Forward-compat with Haraka 4.0 promise hooks

The dispatcher under the hood accepts both the 3.x callback style and an
async/return-value style anticipated for 4.0. A plugin author can write either:

```js
// 3.x
exports.hook_mail = function (next, connection, params) {
  next(DENY, 'no thanks')
}

// 4.0 (any of these forms work today through the test helpers)
exports.hook_mail = async function (connection, params) {
  return DENY // bare rc
}
exports.hook_mail = async function (connection, params) {
  return { rc: DENY, msg: 'no thanks' }
}
exports.hook_mail = async function (connection, params) {
  return [DENY, 'no thanks']
}
```

…and the test code stays identical:

```js
const r = await callMail(plugin, conn, 'sender@example.com')
assertDeny(r, /no thanks/)
```

When Haraka 4 ships, the test suites you write today migrate without changes.

---

## assertions

Small wrappers around the most common assertion patterns. All accept either a raw
`rc` or the `{rc, msg}` result object returned by `callXxx`, so destructuring is
optional.

```js
const { assertCont, assertOk, assertDeny, assertResult } = require('haraka-test-fixtures')

assertCont(r) // rc is undefined or CONT
assertOk(r, /accepted/) // rc === OK + optional msg match
assertDeny(r) // rc is any DENY* code
assertDeny(r, /no thanks/) //   + msg matches
assertDeny(r, /no thanks/, DENYSOFT) //   + specific code

assertResult(conn, plugin, 'pass') // results.get(plugin).pass non-empty
assertResult(conn, plugin, 'pass', /^connect:/)
```

Anything more specific (e.g. "asserts an alias mapped to the right address")
belongs as a test-local helper, not in this library. See
`plugin/aliases/test/index.js` for the pattern.

---

## stub

`fixtures.stub` creates a stub function that records all calls.

```js
const { stub } = require('haraka-test-fixtures')

const s = stub('return-value')
s('arg1', 'arg2')

s.called // true
s.callCount // 1
s.args // ['arg1', 'arg2']  (last call)
s.calls // [['arg1', 'arg2']] (every call)
s.reset() // clears all tracking state
```

---

### dns

A tiny, zero-dependency test DNS server (UDP) for exercising the real
`node:dns` → `haraka-net-utils` → plugin path.
Configure per-name records and failure modes, then point a resolver at it.

```js
const fixtures = require('haraka-test-fixtures')

const dns = await fixtures.dns.start({
  'good.example': {
    a: ['1.2.3.4'],
    mx: [{ preference: 10, exchange: 'mx.good.example' }],
  },
  'broken.example': { rcode: 'SERVFAIL' }, // also NXDOMAIN | REFUSED | NOERROR
  'slow.example': { a: ['1.2.3.4'], delayMs: 200 },
  'gone.example': { drop: true }, // never answers -> resolver timeout
})

// a fresh node:dns Resolver pointed at the test server
const resolver = dns.resolver({ timeout: 500 })
await resolver.resolveMx('good.example')

// or point an existing Resolver / haraka-net-utils dns_config at it:
const restore = dns.patch(require('haraka-net-utils/lib/dns_config'))
// ... run code that calls net_utils.get_mx() ...
restore()

dns.setZone('good.example', { rcode: 'SERVFAIL' }) // mutate at runtime
await dns.close()
```

[ci-img]: https://github.com/haraka/test-fixtures/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/haraka/test-fixtures/actions/workflows/ci.yml
[cov-img]: https://codecov.io/github/haraka/test-fixtures/graph/badge.svg?token=YmOC83OqCH
[cov-url]: https://codecov.io/github/haraka/test-fixtures
[qlty-img]: https://qlty.sh/gh/haraka/projects/haraka-test-fixtures/maintainability.svg
[qlty-url]: https://qlty.sh/gh/haraka/projects/haraka-test-fixtures
