'use strict';

const connection = require('../lib/connection');
// console.log(connection);

exports.connection = {
    'exports createConnection': function (test) {
        test.expect(1);
        test.equal(typeof connection.createConnection, 'function');
        test.done();
    },
    'creates a new connection': function (test) {
        test.expect(1);
        const newCon = connection.createConnection();
        // console.log(newCon);
        test.ok(newCon);
        test.done();
    },
    'remote.ip': function (test) {
        test.expect(1);
        const newCon = connection.createConnection();
        test.equal(newCon.remote.ip, '127.0.0.1');
        test.done();
    },
    'local': function (test) {
        test.expect(1);
        const newCon = connection.createConnection();
        test.deepEqual(newCon.local, {});
        test.done();
    },
    'hello': function (test) {
        test.expect(1);
        const newCon = connection.createConnection();
        test.deepEqual(newCon.hello, {});
        test.done();
    },
    'tls': function (test) {
        test.expect(1);
        const newCon = connection.createConnection();
        test.deepEqual(newCon.tls, {});
        test.done();
    },
    'notes': function (test) {
        test.expect(1);
        const newCon = connection.createConnection();
        test.deepEqual(newCon.notes, {});
        test.done();
    },
    'set': function (test) {
        test.expect(1);
        const newCon = connection.createConnection();
        newCon.set('remote', 'ip', '192.168.1.1');
        test.deepEqual(newCon.remote.ip, '192.168.1.1');
        test.done();
    }
}
