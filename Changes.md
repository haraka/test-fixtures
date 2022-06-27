### Unreleased


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


### 1.0.34 - 2022-05-23

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
    * encapsulate package.json detection in _has_package_json
- don't reset plugin.name when a plugin inherits

### 1.0.5 - Mar 19, 2016

- inheritance tests and package support
- enable more Haraka tests to depend on this
- updates for compat with Haraka/tests/plugins
- better plugin path resolution


[1.0.35]: https://github.com/haraka/haraka-test-fixtures/releases/tag/1.0.35
[1.1.0]: https://github.com/haraka/haraka-test-fixtures/releases/tag/1.1.0
[1.2.0]: https://github.com/haraka/test-fixtures/releases/tag/1.2.0
