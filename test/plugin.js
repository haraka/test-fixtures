const assert = require('assert')

const path = require('path')

const Plugin = require('../lib/plugin')

describe('plugin', function () {
  it('exports a Plugin function', () => {
    assert.equal(typeof Plugin, 'function')
  })

  it('creates a new Plugin from .js', () => {
    const newPlugin = new Plugin(path.join('test', 'fixtures', 'mock-plugin'))
    assert.ok(newPlugin)
  })

  it('creates a new Plugin from dir', () => {
    const newPlugin = new Plugin(
      path.join('test', 'fixtures', 'mock-plugin-dir'),
    )
    assert.ok(newPlugin)
  })

  describe('register', function () {
    beforeEach((done) => {
      this.plugin = new Plugin(path.join('test', 'fixtures', 'mock-plugin-dir'))
      done()
    })

    it('register exists', () => {
      assert.equal(typeof this.plugin.register, 'function')
    })

    it('register runs', () => {
      this.plugin.register()
      assert.ok(true) // register() didn't throw
    })
  })

  it('can register plugin with ineritance', () => {
    const pi = new Plugin(path.join('test', 'fixtures', 'mock-plugin'))
    assert.equal(typeof pi.register, 'function')
    pi.register()
    assert.ok(Object.keys(pi.base))
  })

  it('plugin name remains the same after a plugin inherits', () => {
    const pi = new Plugin(path.join('test', 'fixtures', 'mock-plugin'))
    assert.equal(typeof pi.register, 'function')
    pi.register()
    assert.equal(pi.name, path.join('test', 'fixtures', 'mock-plugin'))
  })
})
