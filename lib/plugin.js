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
    constants.import(global);

    logger.add_log_methods(this, name);

    return this.load_plugin(name);
}

Plugin.prototype.get_full_path = function (name) {

    // the plugin file will be located in one of:
    //   Haraka/plugins/name.js
    //   ./name.js                // npm packaged plugin
    //   ./name-discovered-in-package-json-main-property

    // plugin tests will be located in one of
    //   Haraka/tests/plugins/name.js
    //   ./test/name.js
    //   ./tests/name.js

    // the starting value for __dirname will be the cwd of this module:
    //    ./node_modules/haraka-test-fixtures/lib

    // So, the plugin to be loaded will be in one of:
    //    ../../../plugins/name.js
    //    ../../../name.js
    //    ../../../name-discovered-in-package-json-main-property

    var full_path = path.resolve(__dirname + '/../../../plugins/' + name + '.js');
    if (!fs.existsSync(full_path)) {
        full_path = path.resolve(__dirname + '../../../' + name + '.js');
        // TODO: if still not exists, try package.json
        // and if package.json exists, get main property and try that file
    }
}

Plugin.prototype.load_plugin = function (name) {
    var rf;

    var full_path = this.get_full_path(name);

    try {
        rf = fs.readFileSync(full_path);
    }
    catch (err) {
        throw "Loading test plugin " + name + " failed: " + err;
    }
    var code = '"use strict";' + rf;

    var sandbox = {
        require: vm_harness.sandbox_require,
        __filename: full_path,
        __dirname:  path.dirname(full_path),
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
