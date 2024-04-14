# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/).

### Unreleased

### [1.3.7] - 2024-04-14

- transaction: sync with haraka/Haraka
- connection: import more from haraka/Haraka/connection
- test(conn): expect more connection properties
- doc(README): added example setup

### [1.3.6] - 2024-04-09

- doc(CONTRIBUTING): added

### [1.3.5] - 2024-04-07

- update package.json scripts
- dep: eslint-plugin-haraka -> @haraka/eslint-config
- update .eslintrc

### [1.3.4] - 2024-04-05

- populate [files] in package.json
- plugin: fix comment typo
- doc(README): verbiage improvements
- dep(address-rfc2821): bump from 2.1.1 to 2.1.2 (#61)
- deps: bump to latest

### [1.3.3] - 2023-12-12

- deps(\*): pin versions to latest

### [1.3.2] - 2023-12-12

- dep(haraka-results): bump version to 2.2.3

### [1.3.1] - 2023-12-03

- transaction: update Buffer syntax (sync with Haraka) (#56)

### [1.3.0] - 2023-06-08

- dep(haraka-results): require at least 2.2 (due to redis dep)

### [1.2.1] - 2022-07-07

- ci: use windows & ubuntu workflows in haraka/.github

### [1.2.0] - 2022-06-27

- dep: replace message-stream with email-message
- transaction: replace Header and Body stubs with email-message
- lint: string concatenation

### [1.1.0] - 2022-06-23

- dep: add haraka-message-stream
- transaction: added Body
- transaction: added MessageStream

### [1.0.35] - 2022-06-05

- ci: update GHA workflow with shared
- doc(changes): add Unreleased marker
- ci: add submodule .release

### [1.0.34] - 2022-05-23

- dep(eslint): 6 -> 8
- ci(node): add v18 testing

### 1.0.33 - 2020-12-17

- conn: pass config to new transactions

### 1.0.32 - 2020-07-28

- transaction: add logging methods

### 1.0.31 - 2020-07-28

- transaction: lowercase the keys in class Header

### 1.0.30 - 2019-10-14

- codeclimate: update eslint to v6
- convert eslintrc from json to yaml
- replace node 6 with node 12 CI testing
- lib/plugin: update with es6 class
- es6: object-shorthand
- coverage: replace deprecated istanbul with nyc
- test runner: replace deprecated nodeunit with mocha

### 1.0.29 - 2019-04-11

- put results in transaction. This time for real.

### 1.0.28 - 2019-04-01

- transaction: populate this.results

### 1.0.27 - 2018-11-15

- transaction: have header.add() populate header_decoded too

### 1.0.26 - 2018-11-15

- transaction: add header.get_decoded()

### 1.0.25 - 2018-05-10

- transaction: make t.header a class (as it is in Haraka). Making transaction
  into an es6 class (in 1.0.24) changed how 'this' resolves.

### 1.0.24 - 2018-05-10

- connection: add get() and improved set()
- connection: add init_transaction()
- connection: use es6 classes
- transaction: use es6 classes

### 1.0.23 - 2018-04-04

- added array values to transaction.header and header.get_all support

### 1.0.22 - 2017-09-22

- plugins: provide haraka_require

### 1.0.21 - 2017-09-14

- lint updates

### 1.0.20 - 2017-09-04

- use [haraka-notes](https://github.com/haraka/haraka-notes)

### 1.0.19 - 2017-06-16

- remove version from haraka-results, fixes #21

### 1.0.18 - 2017-05-25

- replace local rules with eslint-plugin-haraka
- add server and setImmedate to the plugin sandbox

### 1.0.17 - 2017-01-26

- add alias of haraka-results at fixtures.results (finger friendly)

### 1.0.16 - Jan 26, 2017

- replace copied results_store with freshly packaged haraka-results

### 1.0.15 - Jan 25, 2017

- update result_store, adding get(plugin) syntax.

### 1.0.14 - Jan 24, 2017

- add path for npm packaged plugin inheriting an npm packaged plugin

### 1.0.13 - Jan 03, 2017

- use path.join in place of path/to/stuff
- remove grunt
- add Appveyor badge

### 1.0.11 - Jan 01, 2017

- lint fixes
- packaging updates

### 1.0.8 - Sep 02, 2016

- add connection.set()

### 1.0.7 - Jul 20, 2016

- normalized connection properties (haraka/Haraka#1098)

### 1.0.6 - Mar 26, 2016

- more reliable package.json detection
  - encapsulate package.json detection in \_has_package_json
- don't reset plugin.name when a plugin inherits

### 1.0.5 - Mar 19, 2016

- inheritance tests and package support
- enable more Haraka tests to depend on this
- updates for compat with Haraka/tests/plugins
- better plugin path resolution

[1.0.34]: https://github.com/haraka/test-fixtures/releases/tag/1.0.34
[1.0.35]: https://github.com/haraka/test-fixtures/releases/tag/1.0.35
[1.1.0]: https://github.com/haraka/test-fixtures/releases/tag/v1.1.0
[1.2.0]: https://github.com/haraka/test-fixtures/releases/tag/v1.2.0
[1.2.1]: https://github.com/haraka/test-fixtures/releases/tag/v1.2.1
[1.3.0]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.0
[1.3.1]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.1
[1.3.2]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.2
[1.3.3]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.3
[1.3.4]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.4
[1.3.5]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.5
[1.3.6]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.6
[1.3.7]: https://github.com/haraka/test-fixtures/releases/tag/v1.3.7
