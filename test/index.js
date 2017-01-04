'use strict';

var path = require('path');

var fixtures = require('../index');

exports.exports = {
    'stub': function (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.stub.stub);
        test.done();
    },
    'logger': function (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.logger.loginfo);
        test.done();
    },
    'connection': function (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.connection.createConnection);
        test.done();
    },
    'transaction': function (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.transaction.createTransaction);
        test.done();
    },
    'line_socket': function (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.line_socket.connect);
        test.done();
    },
    'plugin': function (test) {
        test.expect(1);
        var p = new fixtures.plugin(path.join('test', 'fixtures', 'mock-plugin'));
        test.equal('function', typeof p.load_plugin);
        test.done();
    },
    'result_store': function (test) {
        test.expect(1);
        var rs = new fixtures.result_store();
        // console.log(rs);
        test.equal('function', typeof rs.add);
        test.done();
    },
    'util_hmailitem': function (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.util_hmailitem.newMockHMailItem);
        test.done();
    },
    'vm_harness': function (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.vm_harness.sandbox_require);
        test.done();
    }
}