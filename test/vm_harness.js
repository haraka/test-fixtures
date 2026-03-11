const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const vm = require('../lib/vm_harness')
// console.log(vm);

describe('sandbox_require', function () {
  it('is a function', () => {
    assert.equal(typeof vm.sandbox_require, 'function')
  })

  it('can load a ./ relative path', () => {
    assert.ok(vm.sandbox_require('./logger'))
  })

  it('can load a ../ relative path', () => {
    assert.ok(vm.sandbox_require('../index'))
  })

  it('throws a helpful error for unresolved local modules', () => {
    assert.throws(
      () => vm.sandbox_require('./does-not-exist-xyz.js'),
      /Unable to resolve local module: \.\/does-not-exist-xyz\.js/,
    )
  })
})

describe('add_tests', function () {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vm-harness-'))
  })

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('joins tests_path and filename correctly without trailing slash', () => {
    const modulePath = path.join(tmpDir, 'module.js')
    const testsPath = path.join(tmpDir, 'tests')
    const testPath = path.join(testsPath, 'sample.js')

    fs.mkdirSync(testsPath)
    fs.writeFileSync(modulePath, '')
    fs.writeFileSync(testPath, 'test.ok = true')

    const testExports = {}
    const testCtx = {}
    vm.add_tests(modulePath, testsPath, testExports)

    assert.equal(typeof testExports['sample.js'], 'function')
    testExports['sample.js'](testCtx)
    assert.equal(testCtx.ok, true)
  })
})
