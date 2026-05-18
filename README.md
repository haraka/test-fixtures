[![Build Status][ci-img]][ci-url]
[![CodeCov][cov-img]][cov-url]
[![Qlty][qlty-img]][qlty-url]

# haraka-test-fixtures

Fixtures for testing Haraka and plugins

## Usage

```js
const fixtures = require('haraka-test-fixtures')
```

### A common pattern

```js
beforeEach(() => {
  this.plugin = new fixtures.plugin('pluginName')

  this.connection = fixtures.connection.createConnection()
  this.connection.init_transaction()
})

describe('pluginName', () => {
  it('registers', () => {
    this.plugin.register()
  })
})
```

## Exports the following fixture types:

- connection
- dns
- line_socket
- logger
- plugin
- [results](https://github.com/haraka/haraka-results)
- stub
- transaction
- util_hmailitem

These fixtures are analogs of their like-named siblings in Haraka with varying levels of completeness. If there are functions necessary to enhance your ability to test, please do add them.

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
