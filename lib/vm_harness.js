const fs = require('fs')
const vm = require('vm')

/* eslint no-path-concat: "off" */
const dir_paths = [
  `${__dirname}/../../../`, // for Haraka/tests/plugins
  `${__dirname}/`, // for haraka-test-fixtures/test
]

function dot_files(element) {
  return element.match(/^\./) == null
}

function find_haraka_lib(id) {
  for (let i = 0; i < dir_paths.length; i++) {
    const dirPath = `${dir_paths[i]}${id}.js`
    // console.log('dirPath: ' + dirPath);
    try {
      const stats = fs.statSync(dirPath)
      if (stats.isFile()) {
        return dirPath
      }
    } catch (ignore) {
      // console.error(ignore.message);
    }
  }
}

exports.sandbox_require = function (id) {
  if (id[0] !== '.') {
    // doesn't starts with .
    return require(id) // use normal 'require'
  }

  // has local ./ prefix, so find local file
  const foundPath = find_haraka_lib(id)
  // console.log('foundPath: ' + foundPath);
  return require(foundPath)
}

function make_test(module_path, test_path, additional_sandbox) {
  return function (test) {
    let code = fs.readFileSync(module_path)
    code += fs.readFileSync(test_path)
    const sandbox = {
      require: exports.sandbox_require,
      console,
      Buffer,
      exports: {},
      test,
    }
    for (const k of Object.keys(additional_sandbox)) {
      sandbox[k] = additional_sandbox[k]
    }
    vm.runInNewContext(code, sandbox)
  }
}

exports.add_tests = function (
  module_path,
  tests_path,
  test_exports,
  add_to_sandbox,
) {
  const additional_sandbox = add_to_sandbox || {}
  const tests = fs.readdirSync(tests_path).filter(dot_files)
  for (let x = 0; x < tests.length; x++) {
    test_exports[tests[x]] = make_test(
      module_path,
      tests_path + tests[x],
      additional_sandbox,
    )
  }
}
