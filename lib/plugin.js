'use strict';

// node built-ins
var fs         = require('fs');
var path       = require('path');
var vm         = require('vm');

// npm modules
var constants  = require('haraka-constants');
var config     = require('haraka-config');

// local modules
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
    this.plugin_path = this._get_plugin_path();
    this.config = this._get_config();
    this.last_err = '';
    constants.import(global);

    logger.add_log_methods(this, name);

    return this.load_plugin(name);
}

Plugin.prototype._get_plugin_path = function (name) {
    var plugin = this;

    plugin.hasPackageJson = false;
    if (!name) name = plugin.name;

    var paths = [];

    if (/node_modules\/haraka\-test\-fixtures\/lib$/.test(__dirname)) {
        // for Haraka/plugins/*.js && Haraka/node_modules/*
        var up3 = path.resolve(__dirname, '..', '..', '..');
        paths.push(
            path.resolve(up3, 'plugins', name + '.js'),
            path.resolve(up3, 'plugins', name, 'package.json'),
            path.resolve(up3, 'node_modules', name, 'package.json')
        );
    }
    else if (/\/lib$/.test(__dirname)) {
        // for haraka-test-fixture tests
        paths.push(
            path.resolve(__dirname, '..', name + '.js'),
            path.resolve(__dirname, '..', name, 'package.json')
        );
    }
    else if (/\/plugins$/.test(__dirname)) {
        // for 'inherits' in Haraka/tests/plugins/*.js
        paths.push(
            path.resolve(__dirname, name + '.js'),
            path.resolve(__dirname, name, 'package.json')
        );
    }
    else {
        // for Haraka/plugins/*.js && Haraka/node_modules/*
        paths.push(
            path.resolve(__dirname, 'plugins', name + '.js'),
            path.resolve(__dirname, 'plugins', name, 'package.json'),
            path.resolve(__dirname, 'node_modules', name, 'package.json')
        );
    }
    // console.log(paths);

    for (var i = 0; i < paths.length; i++) {
        var pp = paths[i];
        try {
            fs.statSync(pp);
            if (/\/package\.json$/.test(pp)) {
                plugin.hasPackageJson = true;
            }
            return pp;
        }
        catch (ignore) {
            // console.error(ignore.message);
        }
    };
};

Plugin.prototype._get_config = function () {
    if (this.hasPackageJson) {
        // It's a package/folder plugin - look in plugin folder for defaults,
        // haraka/config folder for overrides
        return config.module_config(
            path.dirname(this.plugin_path),
            process.env.HARAKA || __dirname
        );
    }

    // Plain .js file, git mode - just look in this folder
    return config.module_config(__dirname);
};

Plugin.prototype._get_code = function (pi_path) {
    var plugin = this;

    if (plugin.hasPackageJson) {
        var ppd = path.dirname(pi_path);

        // this isn't working for haraka-test-fixtures tests. Why?
        // return 'exports = require("' + ppd + '");';

        // workaround / ugly cheatin hack
        var js = fs.readFileSync(pi_path);
        return fs.readFileSync(path.join(ppd, (js.main || 'index.js')));
    }

    try {
        return '"use strict";' + fs.readFileSync(pi_path);
    }
    catch (err) {
        throw 'Loading plugin ' + this.name + ' failed: ' + err;
    }
}

Plugin.prototype.load_plugin = function (name, pp) {

    if (!pp) pp = this.plugin_path;
    var code = this._get_code(pp);
    // console.log(code);

    var sandbox = {
        require: vm_harness.sandbox_require,
        __filename: pp,
        __dirname:  path.dirname(pp),
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
    var parent_path = this._get_plugin_path(parent_name);
    var parent_plugin = this.load_plugin(parent_name, parent_path);
    for (var method in parent_plugin) {
        if (!this[method]) {
            this[method] = parent_plugin[method];
        }
    }
    this.base[parent_name] = parent_plugin;
};

module.exports = Plugin;
