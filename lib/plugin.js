// node built-ins
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

// npm modules
const constants = require('haraka-constants')
const config = require('haraka-config')

// local modules
const logger = require('./logger')

exports.registered_hooks = {}
exports.registered_plugins = {}
exports.plugin_list = []

let order = 0

class Plugin {
  constructor(name) {
    this.name = name
    this.base = {}
    this.timeout = 10
    this.plugin_path = this._get_plugin_path(name)
    this.config = this._get_config()
    this.hooks = {}
    this.last_err = ''

    // Set in server.js; initialized to empty object
    // to prevent it from blowing up any unit tests.
    this.server = { notes: {} }

    constants.import(global)

    logger.add_log_methods(this, name)

    this._compile()
  }

  register() {
    // Plugin lifecycle hook - can be overridden via inherits()
  }

  haraka_require(name) {
    return require(`./${name}`)
  }

  core_require(name) {
    return this.haraka_require(name)
  }

  _has_package_json(candidate_path) {
    if (/\/package\.json$/.test(candidate_path)) {
      this.hasPackageJson = true
      return
    }

    const enclosing_dir = path.dirname(candidate_path)
    if (fileExists(path.join(enclosing_dir, 'package.json'))) {
      this.hasPackageJson = true
      return true
    }
    return false
  }

  _get_plugin_path(name) {
    this.hasPackageJson = false
    if (!name) name = this.name
    const paths = []
    if (
      path.basename(__dirname) === 'lib' &&
      path.basename(path.dirname(__dirname)) === 'haraka-test-fixtures' &&
      path.basename(path.dirname(path.dirname(__dirname))) === 'node_modules'
    ) {
      // __dirname ends with node_modules/haraka-test-fixtures/lib

      /*eslint no-global-assign: ["error", {"exceptions": ["__dirname"]}] */
      /*eslint no-native-reassign: ["error", {"exceptions": ["__dirname"]}] */
      __dirname = path.resolve(__dirname, '..', '..', '..')
    }

    if ('lib' === path.basename(__dirname)) {
      // for haraka-test-fixture tests
      paths.push(
        path.resolve(__dirname, '..', `${name}.js`),
        path.resolve(__dirname, '..', name, 'package.json'),
        path.resolve(__dirname, '..', 'test', 'fixtures', `${name}.js`),
        path.resolve(__dirname, '..', 'test', 'fixtures', name, 'package.json'),
      )
    } else if ('plugins' == path.basename(__dirname)) {
      // for 'inherits' in Haraka/tests/plugins/*.js
      paths.push(path.resolve(__dirname, `${name}.js`), path.resolve(__dirname, name, 'package.json'))
    } else {
      if (dirExists(path.join(__dirname, 'plugins'))) {
        // Haraka/plugins/*.js && Haraka/node_modules/*
        paths.push(
          path.resolve(__dirname, 'plugins', `${name}.js`),
          path.resolve(__dirname, 'plugins', name, 'package.json'),
          path.resolve(__dirname, 'node_modules', name, 'package.json'),
        )
      } else {
        // npm packaged plugins
        paths.push(
          // npm packaged plugin inheriting an npm packaged plugin
          path.resolve(__dirname, 'node_modules', name, 'package.json'),

          path.resolve(__dirname, `${name}.js`),
          path.resolve(__dirname, 'package.json'),
        )
      }
    }
    // console.log(paths);

    for (let i = 0; i < paths.length; i++) {
      try {
        fs.statSync(paths[i])
        this._has_package_json(paths[i])
        return paths[i]
      } catch (err) {
        switch (err.code) {
          case 'ENOENT':
            break
          default:
            console.error(`Error checking for plugin ${name} at ${paths[i]}: ${err.message}`)
        }
      }
    }
  }

  _get_config() {
    if (this.hasPackageJson) {
      // It's a package/folder plugin - look in plugin folder for defaults,
      // haraka/config folder for overrides
      return config.module_config(path.dirname(this.plugin_path), process.env.HARAKA || __dirname)
    }

    if (process.env.HARAKA) {
      // Plain .js file, installed mode - look in core folder for defaults,
      // install dir for overrides
      return exports.config.module_config(__dirname, process.env.HARAKA)
    }

    if (process.env.HARAKA_TEST_DIR) {
      return config.module_config(process.env.HARAKA_TEST_DIR)
    }

    // Plain .js file, git mode - just look in this folder
    return config.module_config(__dirname)
  }

  register_hook(hook_name, method_name, priority) {
    priority = parseInt(priority)
    if (!priority) priority = 0
    if (priority > 100) priority = 100
    if (priority < -100) priority = -100

    if (!Array.isArray(exports.registered_hooks[hook_name])) {
      exports.registered_hooks[hook_name] = []
    }
    exports.registered_hooks[hook_name].push({
      plugin: this.name,
      method: method_name,
      priority,
      timeout: this.timeout,
      order: order++,
    })
    this.hooks[hook_name] = this.hooks[hook_name] || []
    this.hooks[hook_name].push(method_name)

    this.loginfo(`registered hook ${hook_name} to ${this.name}.${method_name} priority ${priority}`)
  }

  _get_code(pi_path) {
    if (this.hasPackageJson) {
      let packageDir = path.dirname(pi_path)
      if (/^win(32|64)/.test(process.platform)) {
        // escape the c:\path\back\slashes else they disappear
        packageDir = packageDir.replace(/\\/g, '\\\\')
      }

      return `var _p = require("${packageDir}"); for (var k in _p) { exports[k] = _p[k] }`
    }

    try {
      return `"use strict";${fs.readFileSync(pi_path)}`
    } catch (err) {
      throw `Loading plugin ${this.name} failed: ${err}`
    }
  }

  inherits(parent_name) {
    const parent_plugin = plugins._load_and_compile_plugin(parent_name)
    for (const method in parent_plugin) {
      if (!this[method]) {
        this[method] = parent_plugin[method]
      }
    }
    if (parent_plugin.register) {
      parent_plugin.register.call(this)
    }
    this.base[parent_name] = parent_plugin
  }

  _make_custom_require() {
    return (module) => {
      if (this.hasPackageJson) {
        const mod = require(module)
        constants.import(global)
        global.server = plugins.server
        return mod
      }

      if (module === './config') {
        return this.config
      }

      if (!/^\./.test(module)) {
        return require(module)
      }

      for (const ext of [`${module}.js`, module]) {
        if (fs.existsSync(path.join(__dirname, ext))) {
          return require(module);
        }
      }

      return require(path.join(path.dirname(this.plugin_path), module))
    }
  }

  _compile() {
    const pp = this.plugin_path
    if (!pp) throw 'could not find path to plugin'
    const code = this._get_code(pp)
    if (!code) return

    const sandbox = {
      require: this._make_custom_require(),
      __filename: pp,
      __dirname: path.dirname(pp),
      exports: this,
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      process,
      Buffer,
      Math,
      server: plugins.server,
      setImmediate,
    }
    if (this.hasPackageJson) {
      delete sandbox.__filename
    }
    constants.import(sandbox)
    runInSandbox(code, sandbox, this.plugin_path)
  }
}

function runInSandbox(code, sandbox, filename) {
  if (typeof vm.Script === 'function' && typeof vm.createContext === 'function') {
    const context = vm.createContext(sandbox)
    const script = new vm.Script(code, {
      filename,
      displayErrors: true,
    })
    return script.runInContext(context, { displayErrors: true })
  }

  // Backward-compat fallback for older runtimes.
  return vm.runInNewContext(code, sandbox, filename)
}

function dirExists(dir) {
  try {
    if (fs.statSync(dir).isDirectory()) return true
  } catch (ignore) {}
  return false
}

function fileExists(filePath) {
  try {
    if (fs.statSync(filePath).isFile()) return true
  } catch (ignore) {
    // console.error(ignore);
  }
  return false
}

module.exports = Plugin

const plugins = exports

plugins.Plugin = Plugin

plugins.server = { notes: {} }

logger.add_log_methods(plugins, 'plugins')

plugins.load_plugin = (name) => {
  plugins.loginfo(`loading ${name}`)

  const plugin = plugins._load_and_compile_plugin(name)
  if (plugin) {
    plugins._register_plugin(plugin)
  }

  plugins.registered_plugins[name] = plugin
}

plugins._load_and_compile_plugin = (name) => {
  const plugin = new Plugin(name)
  if (!plugin.plugin_path) {
    throw `Loading plugin ${plugin.name} failed: No plugin with this name found`
  }
  plugin._compile()
  return plugin
}

plugins._register_plugin = (plugin) => {
  // Auto-detect and register hook_* methods
  for (const method in plugin) {
    const match = method.match(/^hook_(.+)/)
    if (!match) continue
    const hook_name = match[1]
    if (typeof plugin[method] === 'function') {
      plugin.register_hook(hook_name, method)
    }
  }

  // Call plugin's register() override point
  if (plugin.register) {
    plugin.register.call(plugin)
  }
}

plugins.load_plugins = (plugin_names) => {
  // Load multiple plugins at once
  if (!Array.isArray(plugin_names)) {
    plugin_names = [plugin_names]
  }

  for (const name of plugin_names) {
    try {
      plugins.load_plugin(name)
    } catch (err) {
      plugins.logerror(`Failed to load plugin ${name}: ${err}`)
    }
  }
}

plugins.shutdown_plugins = () => {
  for (const name in plugins.registered_plugins) {
    const plugin = plugins.registered_plugins[name]
    if (plugin && typeof plugin.shutdown === 'function') {
      try {
        plugin.shutdown()
      } catch (err) {
        plugins.logerror(`Error shutting down ${name}: ${err}`)
      }
    }
  }

  plugins.registered_plugins = {}
  plugins.registered_hooks = {}
  plugins.plugin_list = []
}
