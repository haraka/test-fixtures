'use strict';

var index = require('../index');
// console.log(index);

exports.exports = {
    'stub': function (test) {
        test.expect(1);
        test.equal(typeof index.stub.stub, 'function');
        test.done();
    },
    'logger': function (test) {
        test.expect(1);
        test.equal(typeof index.logger.loginfo, 'function');
        test.done();
    },
    'connection': function (test) {
        test.expect(1);
        test.equal(typeof index.connection.createConnection, 'function');
        test.done();
    },
    'transaction': function (test) {
        test.expect(1);
        test.equal(typeof index.transaction.createTransaction, 'function');
        test.done();
    },
    'line_socket': function (test) {
        test.expect(1);
        test.equal(typeof index.line_socket.connect, 'function');
        test.done();
    },
    'util_hmailitem': function (test) {
        test.expect(1);
        test.equal(typeof index.util_hmailitem.newMockHMailItem, 'function');
        test.done();
    },
    'vm_harness': function (test) {
        test.expect(1);
        test.equal(typeof index.vm_harness.sandbox_require, 'function');
        test.done();
    }
}