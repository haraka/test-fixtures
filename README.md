[![Build Status][ci-img]][ci-url]
[![Code Coverage][cov-img]][cov-url]
[![Code Climate][clim-img]][clim-url]

[![NPM][npm-img]][npm-url]

# haraka-test-fixtures

Fixtures for testing Haraka and plugins

# Usage

`const fixtures = require('haraka-test-fixtures');`

# Exports the following fixture types:

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
[npm-img]: https://nodei.co/npm/haraka-test-fixtures.png
[npm-url]: https://www.npmjs.com/package/haraka-test-fixtures
