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
    beforeEach(() => {
      this.plugin = new Plugin(path.join('test', 'fixtures', 'mock-plugin-dir'))
    })

    it('register exists', () => {
      assert.equal(typeof this.plugin.register, 'function')
    })

    it('register runs', () => {
      this.plugin.register()
      assert.ok(true) // register() didn't throw
    })

    it('can register plugin with inheritance', () => {
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

  describe('_get_plugin_path', function () {
    let plugin

    beforeEach(() => {
      plugin = new Plugin(path.join('test', 'fixtures', 'mock-plugin'))
    })

    it('returns a path for a .js plugin', () => {
      const result = plugin._get_plugin_path(
        path.join('test', 'fixtures', 'mock-plugin'),
      )
      assert.ok(result)
      assert.ok(result.endsWith('.js'))
    })

    it('returns an absolute path', () => {
      const result = plugin._get_plugin_path(
        path.join('test', 'fixtures', 'mock-plugin'),
      )
      assert.ok(path.isAbsolute(result))
    })

    it('returns a path ending in package.json for a dir plugin', () => {
      const result = plugin._get_plugin_path(
        path.join('test', 'fixtures', 'mock-plugin-dir'),
      )
      assert.ok(result)
      assert.ok(result.endsWith('package.json'))
    })

    it('sets hasPackageJson true for a dir plugin', () => {
      plugin._get_plugin_path(path.join('test', 'fixtures', 'mock-plugin-dir'))
      assert.equal(plugin.hasPackageJson, true)
    })

    it('sets hasPackageJson false for a .js plugin', () => {
      plugin.hasPackageJson = true
      plugin._get_plugin_path(path.join('test', 'fixtures', 'mock-plugin'))
      assert.equal(plugin.hasPackageJson, false)
    })

    it('returns undefined for a non-existent plugin', () => {
      const result = plugin._get_plugin_path('nonexistent-plugin')
      assert.equal(result, undefined)
    })
  })

  describe('_get_code', function () {
    it('loads package plugins via directory require shim', () => {
      const pi = new Plugin(path.join('test', 'fixtures', 'mock-plugin-dir'))
      const code = pi._get_code(pi.plugin_path)

      assert.equal(typeof code, 'string')
      assert.ok(code.includes('require("'))
      assert.ok(code.includes('mock-plugin-dir'))
    })
  })
})
