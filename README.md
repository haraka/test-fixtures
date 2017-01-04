[![Build Status][ci-img]][ci-url]
[![Code Coverage][cov-img]][cov-url]
[![Code Climate][clim-img]][clim-url]
[![Windows Build status](https://ci.appveyor.com/api/projects/status/ynjmw8jy76gt7inh?svg=true)](https://ci.appveyor.com/project/msimerson/haraka-test-fixtures)

[![NPM][npm-img]][npm-url]

# haraka-test-fixtures

Fixtures for testing Haraka and plugins

# Usage

var fixtures = require('haraka-test-fixtures');

# Exports the following fixture types:

* connection
* line_socket
* logger
* plugin
* result_store
* stub
* transaction
* util_hmailitem

These fixtures are rough analogs of their like-named siblings in Haraka with
varying levels of completeness. If there are functions necessary to enhance
your ability to test, please do add them here.


[ci-img]: https://travis-ci.org/haraka/haraka-test-fixtures.svg
[ci-url]: https://travis-ci.org/haraka/haraka-test-fixtures
[cov-img]: https://codecov.io/github/haraka/haraka-test-fixtures/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-test-fixtures
[clim-img]: https://codeclimate.com/github/haraka/haraka-test-fixtures/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-test-fixtures
[npm-img]: https://nodei.co/npm/haraka-test-fixtures.png
[npm-url]: https://www.npmjs.com/package/haraka-test-fixtures
