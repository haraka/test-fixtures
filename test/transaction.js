'use strict';

const transaction = require('../lib/transaction');
// console.log(transaction);

exports.transaction = {
    'exports createTransaction' (test) {
        test.expect(1);
        test.equal(typeof transaction.createTransaction, 'function');
        test.done();
    },
    'creates a new transaction' (test) {
        test.expect(1);
        const newTrans = transaction.createTransaction();
        // console.log(newTrans);
        test.ok(newTrans);
        test.done();
    },
    'can set and get a header' (test) {
        test.expect(1);
        const newTrans = transaction.createTransaction();
        newTrans.add_header('X-Test-Header', 'Has a value');
        test.equal(newTrans.header.get('X-Test-Header'), 'Has a value');
        test.done();
    },
    'can call message_stream.add_line' (test) {
        test.expect(1);
        const newTrans = transaction.createTransaction();
        //console.log(newTrans.message_stream);
        test.ok(newTrans.message_stream.add_line('foo\r\n'));
        test.done();
    },
    'can add a multiple value header' (test) {
        test.expect(2);
        const newTrans = transaction.createTransaction();
        newTrans.add_header('X-Test-Header', 'Has a value');
        newTrans.add_header('X-Test-Header','and another');
        const testHdrVals = newTrans.header.get_all('X-Test-Header');
        test.equal(testHdrVals[0], 'Has a value');
        test.equal(testHdrVals[1], 'and another');
        test.done();
    }
}

exports.Header = {
    setUp (done) {
        this.txn = transaction.createTransaction();
        done();
    },
    'add/get' (test) {
        test.expect(2)
        this.txn.header.add('From', 'Some Body <body@example.com>')
        // console.log(this.txn);
        test.ok(this.txn)
        test.equal(this.txn.header.get('From'), 'Some Body <body@example.com>')
        test.done();
    },
    'get_decoded' (test) {
        test.expect(2)
        this.txn.header.add('From', 'Some Body <body@example.com>')
        // console.log(this.txn);
        test.ok(this.txn)
        test.equal(this.txn.header.get_decoded('From'), 'Some Body <body@example.com>')
        test.done();
    }

}