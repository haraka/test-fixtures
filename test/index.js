'use strict';

var path = require('path');

var fixtures = require('../index');

exports.exports = {
    'stub': function (test) {
        test.expect(1);
        test.equal(typeof fixtures.stub.stub, 'function');
        test.done();
    },
    'logger': function (test) {
        test.expect(1);
        test.equal(typeof fixtures.logger.loginfo, 'function');
        test.done();
    },
    'connection': function (test) {
        test.expect(1);
        test.equal(typeof fixtures.connection.createConnection, 'function');
        test.done();
    },
    'transaction': function (test) {
        test.expect(1);
        test.equal(typeof fixtures.transaction.createTransaction, 'function');
        test.done();
    },
    'line_socket': function (test) {
        test.expect(1);
        test.equal(typeof fixtures.line_socket.connect, 'function');
        test.done();
    },
    'plugin': function (test) {
        test.expect(1);
        var p = fixtures.plugin(path.join('test','fixtures','mock-plugin'));
        test.equal(typeof p.load_plugin, 'function');
        test.done();
    },
    'result_store': function (test) {
        test.expect(1);
        var rs = new fixtures.result_store();
        // console.log(rs);
        test.equal(typeof rs.add, 'function');
        test.done();
    },
    'util_hmailitem': function (test) {
        test.expect(1);
        test.equal(typeof fixtures.util_hmailitem.newMockHMailItem, 'function');
        test.done();
    },
    'vm_harness': function (test) {
        test.expect(1);
        test.equal(typeof fixtures.vm_harness.sandbox_require, 'function');
        test.done();
    }
}