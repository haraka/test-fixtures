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
- line_socket
- logger
- plugin
- [results](https://github.com/haraka/haraka-results)
- stub
- transaction
- util_hmailitem

These fixtures are analogs of their like-named siblings in Haraka with varying levels of completeness. If there are functions necessary to enhance your ability to test, please do add them.

[ci-img]: https://github.com/haraka/test-fixtures/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/haraka/test-fixtures/actions/workflows/ci.yml
[cov-img]: https://codecov.io/github/haraka/test-fixtures/graph/badge.svg?token=YmOC83OqCH
[cov-url]: https://codecov.io/github/haraka/test-fixtures
[qlty-img]: https://qlty.sh/gh/haraka/projects/haraka-test-fixtures/maintainability.svg
[qlty-url]: https://qlty.sh/gh/haraka/projects/haraka-test-fixtures
