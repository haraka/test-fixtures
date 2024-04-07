const assert = require('assert')

const vm = require('../lib/vm_harness')
// console.log(vm);

describe('sandbox_require', function () {
  it('is a function', (done) => {
    assert.equal(typeof vm.sandbox_require, 'function')
    done()
  })

  it('can load a ./ relative path', (done) => {
    assert.ok(vm.sandbox_require('./logger'))
    done()
  })

  it('can load a ../ relative path', (done) => {
    assert.ok(vm.sandbox_require('../index'))
    done()
  })
})
