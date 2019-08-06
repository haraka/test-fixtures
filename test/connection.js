'use strict';

const connection = require('../lib/connection');
// console.log(connection);

exports.exports = {
    'Connection' (test) {
        test.expect(1);
        test.equal(typeof connection.Connection, 'function');
        test.done();
    },
    'createConnection' (test) {
        test.expect(1);
        test.equal(typeof connection.createConnection, 'function');
        test.done();
    },
}

exports.connection = {
    setUp (done) {
        this.connection = connection.createConnection()
        done()
    },
    'creates a new connection' (test) {
        test.expect(1);
        test.ok(this.connection);
        test.done();
    },
    'creates a new transaction' (test) {
        test.expect(1);
        this.connection.init_transaction();
        test.ok(this.connection.transaction);
        test.done();
    },
    'remote.ip' (test) {
        test.expect(1);
        test.equal(this.connection.remote.ip, '127.0.0.1');
        test.done();
    },
    'local' (test) {
        test.expect(1);
        test.deepEqual(this.connection.local, {});
        test.done();
    },
    'hello' (test) {
        test.expect(1);
        test.deepEqual(this.connection.hello, {});
        test.done();
    },
    'tls' (test) {
        test.expect(1);
        test.deepEqual(this.connection.tls, {});
        test.done();
    },
    'notes' (test) {
        test.expect(1);
        test.deepEqual(this.connection.notes, {});
        test.done();
    },
    'set' (test) {
        test.expect(1);
        this.connection.set('remote', 'ip', '192.168.1.1');
        test.deepEqual(this.connection.remote.ip, '192.168.1.1');
        test.done();
    }
}
