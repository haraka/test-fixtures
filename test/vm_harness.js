'use strict';

const vm = require('../lib/vm_harness');
// console.log(vm);

exports.sandbox_require = {
    'is a function': function (test) {
        test.expect(1);
        test.equal(typeof vm.sandbox_require, 'function');
        test.done();
    },
    'can load a ./ relative path': function (test) {
        test.expect(1);
        test.ok(vm.sandbox_require('./logger'));
        test.done();
    },
    'can load a ../ relative path': function (test) {
        test.expect(1);
        test.ok(vm.sandbox_require('../index'));
        test.done();
    }
}