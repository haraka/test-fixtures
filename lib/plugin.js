'use strict';

var fs         = require('fs');
var path       = require('path');
var vm         = require('vm');

var constants  = require('haraka-constants');

var stub       = require('./stub').stub;
var vm_harness = require('./vm_harness');
var logger     = require('./logger');

function Plugin (name) {
    if (false === (this instanceof Plugin)) {
        return new Plugin(name);
    }

    this.name = name;
    this.base = {};
    this.register_hook = stub();
    this.config = stub();
    this.last_err = '';
    constants.import(global);

    logger.add_log_methods(this, name);

    this.dir_paths = [
        __dirname + '/../../../plugins/',   // Haraka/plugins/foo
        __dirname + '../../../',            // npm packaged plugins
        './',                               // testing
    ];

    return this.load_plugin(name);
}

Plugin.prototype.get_file_contents = function (name) {

    // the starting value for __dirname will be the cwd of this module:
    //    ./node_modules/haraka-test-fixtures/lib

    // the plugin file will be located in one of:
    //   ./plugins/name.js
    //   ./name.js                // npm packaged plugin
    //   ./name-discovered-in-package-json-main-property

    // So, the plugin to be loaded will be found in one of:
    //    ../../../plugins/name.js
    //    ../../../name.js
    //    ../../../name-discovered-in-package-json-main-property

    // plugin tests will be located in one of
    //   ./tests/plugins/name.js
    //   ./tests/name.js
    //   ./test/name.js

    if (this.plugin_dir) {
        // this runs when a plugin loads another plugin, such as when
        // a plugin calls this.inherits();
        return fs.readFileSync(path.resolve(this.plugin_dir, name + '.js'));
    }

    if (this.dir_paths.length === 0) {
        throw "Loading test plugin " + name + " failed: " + this.last_err;
    }

    var dp = this.dir_paths.shift();
    this.full_path = path.resolve(dp + name + '.js');

    try {
        var content = fs.readFileSync(this.full_path);
        this.plugin_dir = dp;
        return content;
    }
    catch (err) {
        // console.error(err.message);
        this.last_err = err;
        this.get_file_contents(name);
    }
}

Plugin.prototype.load_plugin = function (name) {
    var rf = this.get_file_contents(name);

    var code = '"use strict";' + rf;

    var sandbox = {
        require: vm_harness.sandbox_require,
        __filename: this.full_path,
        __dirname:  path.dirname(this.full_path),
        exports: this,
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        process: process,
        Buffer: Buffer,
        Math: Math,
    };
    constants.import(sandbox);
    try {
        vm.runInNewContext(code, sandbox, name);
    }
    catch (err) {
        throw err;
    }

    return this;
};

Plugin.prototype.inherits = function (parent_name) {
    var parent_plugin = this.load_plugin(parent_name);
    for (var method in parent_plugin) {
        if (!this[method]) {
            this[method] = parent_plugin[method];
        }
    }
    this.base[parent_name] = parent_plugin;
};

module.exports = Plugin;
