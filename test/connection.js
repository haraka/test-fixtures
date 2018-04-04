'use strict';

const connection = require('../lib/connection');
// console.log(connection);

exports.exports = {
    'Connection': function (test) {
        test.expect(1);
        test.equal(typeof connection.Connection, 'function');
        test.done();
    },
    'createConnection': function (test) {
        test.expect(1);
        test.equal(typeof connection.createConnection, 'function');
        test.done();
    },
}

exports.connection = {
    setUp: function (done) {
        this.connection = connection.createConnection()
        done()
    },
    'creates a new connection': function (test) {
        test.expect(1);
        test.ok(this.connection);
        test.done();
    },
    'creates a new transaction': function (test) {
        test.expect(1);
        this.connection.init_transaction();
        test.ok(this.connection.transaction);
        test.done();
    },
    'remote.ip': function (test) {
        test.expect(1);
        test.equal(this.connection.remote.ip, '127.0.0.1');
        test.done();
    },
    'local': function (test) {
        test.expect(1);
        test.deepEqual(this.connection.local, {});
        test.done();
    },
    'hello': function (test) {
        test.expect(1);
        test.deepEqual(this.connection.hello, {});
        test.done();
    },
    'tls': function (test) {
        test.expect(1);
        test.deepEqual(this.connection.tls, {});
        test.done();
    },
    'notes': function (test) {
        test.expect(1);
        test.deepEqual(this.connection.notes, {});
        test.done();
    },
    'set': function (test) {
        test.expect(1);
        this.connection.set('remote', 'ip', '192.168.1.1');
        test.deepEqual(this.connection.remote.ip, '192.168.1.1');
        test.done();
    }
}
