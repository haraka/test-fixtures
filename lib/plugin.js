
// node built-ins
const fs         = require('fs');
const path       = require('path');
const vm         = require('vm');

// npm modules
const constants  = require('haraka-constants');
const config     = require('haraka-config');

// local modules
const stub       = require('./stub').stub;
const vm_harness = require('./vm_harness');
const logger     = require('./logger');

class Plugin {
    constructor (name) {
        if (false === (this instanceof Plugin)) {
            return new Plugin(name);
        }

        this.name = name;
        this.base = {};
        this.register_hook = stub();
        this.plugin_path = this._get_plugin_path(name);
        this.config = this._get_config();
        this.hooks = {};
        this.last_err = '';

        // Set in server.js; initialized to empty object
        // to prevent it from blowing up any unit tests.
        this.server = { notes: {} };

        constants.import(global);

        logger.add_log_methods(this, name);

        return this.load_plugin(name);
    }

    _has_package_json (plugin_path) {
        if (/\/package\.json$/.test(plugin_path)) {
            this.hasPackageJson = true;
            return;
        }

        const enclosing_dir = path.dirname(plugin_path);
        if (fileExists(path.join(enclosing_dir, 'package.json'))) {
            this.hasPackageJson = true;
            return true;
        }
        return false;
    }

    _get_plugin_path (name) {
        const plugin = this;

        plugin.hasPackageJson = false;
        if (!name) name = plugin.name;

        const paths = [];
        if (path.basename(__dirname) === 'lib'
            && path.basename(path.dirname(__dirname)) === 'haraka-test-fixtures'
            && path.basename(path.dirname(path.dirname(__dirname))) === 'node_modules') {
            // __dirname ends with node_modules/haraka-text-fixtures/lib

            /*eslint no-global-assign: ["error", {"exceptions": ["__dirname"]}] */
            /*eslint no-native-reassign: ["error", {"exceptions": ["__dirname"]}] */
            __dirname = path.resolve(__dirname, '..', '..', '..');
        }

        if ('lib' === path.basename(__dirname)) {
            // for haraka-test-fixture tests
            paths.push(
                path.resolve(__dirname, '..', `${name}.js`),
                path.resolve(__dirname, '..', name, 'package.json')
            );
        }
        else if ('plugins' == path.basename(__dirname)) {
            // for 'inherits' in Haraka/tests/plugins/*.js
            paths.push(
                path.resolve(__dirname, `${name}.js`),
                path.resolve(__dirname, name, 'package.json')
            );
        }
        else {
            if (dirExists(path.join(__dirname, 'plugins'))) {
                // Haraka/plugins/*.js && Haraka/node_modules/*
                paths.push(
                    path.resolve(__dirname, 'plugins', `${name}.js`),
                    path.resolve(__dirname, 'plugins', name, 'package.json'),
                    path.resolve(__dirname, 'node_modules', name, 'package.json')
                );
            }
            else {
                // npm packaged plugins
                paths.push(
                    // npm packaged plugin inheriting an npm packaged plugin
                    path.resolve(__dirname, 'node_modules', name, 'package.json'),

                    path.resolve(__dirname, `${name}.js`),
                    path.resolve(__dirname, 'package.json')
                );
            }
        }
        // console.log(paths);

        for (let i = 0; i < paths.length; i++) {
            try {
                fs.statSync(paths[i]);
                this._has_package_json(paths[i]);
                return paths[i];
            }
            catch (ignore) {
                // console.error(ignore.message);
            }
        }
    }

    _get_config () {
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
    }

    _get_code (pi_path) {
        const plugin = this;

        if (plugin.hasPackageJson) {
            const ppd = path.dirname(pi_path);

            // this isn't working for haraka-test-fixtures tests. Why?
            // return 'exports = require("' + ppd + '");';

            // workaround / ugly cheatin hack
            const js = fs.readFileSync(pi_path);
            return fs.readFileSync(path.join(ppd, (js.main || 'index.js')));
        }

        try {
            return '"use strict";' + fs.readFileSync(pi_path);
        }
        catch (err) {
            throw `Loading plugin ${this.name} failed: ${err}`;
        }
    }

    load_plugin (name, pp) {

        if (!this.name) {
            // don't change plugin name when called by inherits();
            this.name = name;
        }
        if (!pp) pp = this.plugin_path;
        if (!pp) throw 'could not find path to plugin';
        const code = this._get_code(pp);
        // console.log(code);

        const sandbox = {
            require: vm_harness.sandbox_require,
            __filename: pp,
            __dirname:  path.dirname(pp),
            exports: this,
            console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            process,
            Buffer,
            Math,
            server: this.server,
            setImmediate
        };
        constants.import(sandbox);
        vm.runInNewContext(code, sandbox, name);

        return this;
    }

    inherits (parent_name) {
        const parent_path = this._get_plugin_path(parent_name);
        const parent_plugin = this.load_plugin(parent_name, parent_path);
        for (const method in parent_plugin) {
            if (!this[method]) {
                this[method] = parent_plugin[method];
            }
        }
        this.base[parent_name] = parent_plugin;
    }

    haraka_require (name) {
        return require('./' + name);
    }
}

function dirExists (dir) {
    try {
        if (fs.statSync(dir).isDirectory()) return true;
    }
    catch (ignore) {}
    return false;
}

function fileExists (filePath) {
    try {
        if (fs.statSync(filePath).isFile()) return true;
    }
    catch (ignore) {
        // console.error(ignore);
    }
    return false;
}

module.exports = Plugin;
