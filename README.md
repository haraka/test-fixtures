[![Build Status][ci-img]][ci-url]
[![Code Coverage][cov-img]][cov-url]
[![Code Climate][clim-img]][clim-url]

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
[cov-img]: https://codecov.io/github/haraka/test-fixtures/coverage.svg
[cov-url]: https://codecov.io/github/haraka/test-fixtures
[clim-img]: https://codeclimate.com/github/haraka/test-fixtures/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/test-fixtures
