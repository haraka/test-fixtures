
const assert = require('assert')

const transaction = require('../lib/transaction');

describe('transaction', function () {

    it('exports createTransaction', (done) => {
        assert.equal(typeof transaction.createTransaction, 'function');
        done();
    })

    it('creates a new transaction', (done) => {
        const newTrans = transaction.createTransaction();
        // console.log(newTrans);
        assert.ok(newTrans);
        done();
    })

    it('can set and get a header', (done) => {
        const newTrans = transaction.createTransaction();
        newTrans.add_header('X-Test-Header', 'Has a value');
        assert.equal(newTrans.header.get('X-Test-Header'), 'Has a value');
        done();
    })

    it('can call message_stream.add_line', () => {
        const newTrans = transaction.createTransaction();
        newTrans.message_stream.add_line('foo\r\n')
    })

    it('can add a multiple value header', (done) => {
        const newTrans = transaction.createTransaction();
        newTrans.add_header('X-Test-Header', 'Has a value');
        newTrans.add_header('X-Test-Header','and another');
        const testHdrVals = newTrans.header.get_all('X-Test-Header');
        assert.equal(testHdrVals[0], 'Has a value');
        assert.equal(testHdrVals[1], 'and another');
        done();
    })

    it('can add_data with parse_body = true', (done) => {
        const newTrans = transaction.createTransaction('', {"headers":{"max_lines":1000}});
        newTrans.parse_body = true;
        newTrans.add_data(`From: test@example.com\r\n`);
        newTrans.add_data(`\r\n`);
        newTrans.add_data(`abcde\r\n`);
        newTrans.add_data(`zyxwvu\r\n`);
        done();
    })

    describe('Header', function () {

        beforeEach((done) => {
            this.txn = transaction.createTransaction();
            done()
        })

        it('add/get', (done) => {
            this.txn.header.add('From', 'Some Body <body@example.com>')
            assert.ok(this.txn)
            assert.equal(this.txn.header.get('From'), 'Some Body <body@example.com>')
            done();
        })

        it('get_decoded', (done) => {
            this.txn.header.add('From', 'Some Body <body@example.com>')
            assert.ok(this.txn)
            assert.equal(this.txn.header.get_decoded('From'), 'Some Body <body@example.com>')
            done();
        })
    })
})
