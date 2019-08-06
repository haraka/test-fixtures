'use strict';

const path = require('path');

const fixtures = require('../index');

exports.exports = {
    'stub' (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.stub.stub);
        test.done();
    },
    'logger' (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.logger.loginfo);
        test.done();
    },
    'connection' (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.connection.createConnection);
        test.done();
    },
    'transaction' (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.transaction.createTransaction);
        test.done();
    },
    'line_socket' (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.line_socket.connect);
        test.done();
    },
    'plugin' (test) {
        test.expect(1);
        const p = new fixtures.plugin(path.join('test', 'fixtures', 'mock-plugin'));
        test.equal('function', typeof p.load_plugin);
        test.done();
    },
    'result_store' (test) {
        test.expect(1);
        const rs = new fixtures.result_store();
        // console.log(rs);
        test.equal('function', typeof rs.add);
        test.done();
    },
    'util_hmailitem' (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.util_hmailitem.newMockHMailItem);
        test.done();
    },
    'vm_harness' (test) {
        test.expect(1);
        test.equal('function', typeof fixtures.vm_harness.sandbox_require);
        test.done();
    }
}