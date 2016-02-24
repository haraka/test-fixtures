'use strict';

var Plugin = require('../lib/plugin');
// console.log(Plugin);

exports.Plugin = {
    'exports a Plugin function': function (test) {
        test.expect(1);
        test.equal(typeof Plugin, 'function');
        test.done();
    },
    'creates a new Plugin': function (test) {
        test.expect(1);
        var newPlugin = new Plugin('test/fixtures/mock-plugin');
        // console.log(newPlugin);
        test.ok(newPlugin);
        test.done();
    },
}