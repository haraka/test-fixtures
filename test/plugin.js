'use strict';

var Plugin = require('../lib/plugin');
// console.log(Plugin);

exports.Plugin = {
    'exports a Plugin function': function (test) {
        test.expect(1);
        test.equal(typeof Plugin, 'function');
        test.done();
    },
    'creates a new Plugin from .js': function (test) {
        test.expect(1);
        var newPlugin = new Plugin('test/fixtures/mock-plugin');
        // console.log(newPlugin);
        test.ok(newPlugin);
        test.done();
    },
    'creates a new Plugin from dir': function (test) {
        test.expect(1);
        var newPlugin = new Plugin('test/fixtures/mock-plugin-dir');
        // console.log(newPlugin);
        test.ok(newPlugin);
        test.done();
    },
}

exports.contents = {
    setUp: function (done) {
        // console.log(Plugin);
        this.plugin = new Plugin('test/fixtures/mock-plugin-dir');
        done();
    },
    'register exists': function (test) {
        test.expect(1);
        // console.log(this.plugin);
        test.equal(typeof this.plugin.register, 'function');
        test.done();
    },
    'register runs': function (test) {
        test.expect(1);
        this.plugin.register();
        test.ok(true); // register() didn't throw
        test.done();
    }
}

exports.inherits = {
    'can register plugin with ineritance': function (test) {
        test.expect(2);
        var pi = new Plugin('test/fixtures/mock-plugin');
        test.equal(typeof pi.register, 'function');
        pi.register();
        test.ok(Object.keys(pi.base));
        test.done();
    },
}