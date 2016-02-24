'use strict';

var vm = require('../lib/vm_harness');
// console.log(vm);

exports.sandbox_require = {
    'is a function': function (test) {
        test.expect(1);
        test.equal(typeof vm.sandbox_require, 'function');
        test.done();
    },
}