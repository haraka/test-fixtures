
# 1.0.19 - 2017-__-__

# 1.0.18 - 2017-05-25

- replace local rules with eslint-plugin-haraka 
- add server and setImmedate to the plugin sandbox

# 1.0.17 - 2017-01-26

- add alias of haraka-results at fixtures.results (finger friendly)

# 1.0.16 - Jan 26, 2017

- replace copied results_store with freshly packaged haraka-results

# 1.0.15 - Jan 25, 2017

- update result_store, adding get(plugin) syntax.

# 1.0.14 - Jan 24, 2017

- add path for npm packaged plugin inheriting an npm packaged plugin

# 1.0.13 - Jan 03, 2017

- use path.join in place of path/to/stuff
- remove grunt
- add Appveyor badge

# 1.0.11 - Jan 01, 2017

- lint fixes
- packaging updates

# 1.0.8 - Sep 02, 2016

- add connection.set()

# 1.0.7 - Jul 20, 2016

- normalized connection properties (haraka/Haraka#1098)

# 1.0.6 - Mar 26, 2016

- more reliable package.json detection
    * encapsulate package.json detection in _has_package_json
- don't reset plugin.name when a plugin inherits

# 1.0.5 - Mar 19, 2016

- inheritance tests and package support
- enable more Haraka tests to depend on this
- updates for compat with Haraka/tests/plugins
- better plugin path resolution
