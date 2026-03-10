const assert = require('assert')

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
})
