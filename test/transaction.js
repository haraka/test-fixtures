'use strict';

var transaction = require('../lib/transaction');
// console.log(transaction);

exports.transaction = {
    'exports createTransaction': function (test) {
        test.expect(1);
        test.equal(typeof transaction.createTransaction, 'function');
        test.done();
    },
    'creates a new transaction': function (test) {
        test.expect(1);
        var newTrans = transaction.createTransaction();
        // console.log(newTrans);
        test.ok(newTrans);
        test.done();
    },
    'can add a header': function (test) {
        test.expect(1);
        var newTrans = transaction.createTransaction();
        newTrans.add_header('X-Test-Header', 'Has a value');
        test.ok(true);  // previous function didn't throw
        test.done();
    },
    'can get a header': function (test) {
        test.expect(1);
        var newTrans = transaction.createTransaction();
        newTrans.add_header('X-Test-Header', 'Has a value');
        test.equal(newTrans.header.get('X-Test-Header'), 'Has a value');
        test.done();
    },
    'can call message_stream.add_line': function (test) {
        test.expect(1);
        var newTrans = transaction.createTransaction();
        //console.log(newTrans.message_stream);
        test.ok(newTrans.message_stream.add_line('foo\r\n'));
        test.done();
    },
}
