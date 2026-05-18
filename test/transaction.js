'use strict'

const assert = require('node:assert/strict')
const { describe, it, beforeEach } = require('node:test')

const transaction = require('../lib/transaction')

describe('transaction', () => {
  it('exports createTransaction', () => {
    assert.equal(typeof transaction.createTransaction, 'function')
  })

  it('creates a new transaction', () => {
    const newTrans = transaction.createTransaction()
    assert.ok(newTrans)
  })

  it('can set and get a header', () => {
    const newTrans = transaction.createTransaction()
    newTrans.add_header('X-Test-Header', 'Has a value')
    assert.equal(newTrans.header.get('X-Test-Header'), 'Has a value')
  })

  it('can call message_stream.add_line', () => {
    const newTrans = transaction.createTransaction()
    newTrans.message_stream.add_line('foo\r\n')
  })

  it('can add a multiple value header', () => {
    const newTrans = transaction.createTransaction()
    newTrans.add_header('X-Test-Header', 'Has a value')
    newTrans.add_header('X-Test-Header', 'and another')
    const testHdrVals = newTrans.header.get_all('X-Test-Header')
    assert.equal(testHdrVals[0], 'Has a value')
    assert.equal(testHdrVals[1], 'and another')
  })

  it('can add_data with parse_body = true', () => {
    const newTrans = transaction.createTransaction('', {
      headers: { max_lines: 1000 },
    })
    newTrans.parse_body = true
    newTrans.add_data(`From: test@example.com\r\n`)
    newTrans.add_data(`\r\n`)
    newTrans.add_data(`abcde\r\n`)
    newTrans.add_data(`zyxwvu\r\n`)
  })

  describe('Header', () => {
    let txn

    beforeEach(() => {
      txn = transaction.createTransaction()
    })

    it('add/get', () => {
      txn.header.add('From', 'Some Body <body@example.com>')
      assert.ok(txn)
      assert.equal(txn.header.get('From'), 'Some Body <body@example.com>')
    })

    it('get_decoded', () => {
      txn.header.add('From', 'Some Body <body@example.com>')
      assert.ok(txn)
      assert.equal(txn.header.get_decoded('From'), 'Some Body <body@example.com>')
    })
  })
})
