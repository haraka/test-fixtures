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
}