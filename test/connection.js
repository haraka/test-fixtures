'use strict';

var connection = require('../lib/connection');
// console.log(connection);

exports.connection = {
    'exports createConnection': function (test) {
        test.expect(1);
        test.equal(typeof connection.createConnection, 'function');
        test.done();
    },
    'creates a new connection': function (test) {
        test.expect(1);
        var newCon = connection.createConnection();
        // console.log(newCon);
        test.ok(newCon);
        test.done();
    },
    'remote_ip': function (test) {
        test.expect(1);
        var newCon = connection.createConnection();
        test.equal(newCon.remote.ip, '127.0.0.1');
        test.done();
    }
}
