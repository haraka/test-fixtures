
const assert = require('assert')
const path   = require('path');

const fixtures = require('../index');


describe('test-fixtures', function () {

    it('stub', (done) => {
        assert.equal('function', typeof fixtures.stub.stub);
        done();
    })
    it('logger', (done) => {
        assert.equal('function', typeof fixtures.logger.loginfo);
        done();
    })
    it('connection', (done) => {
        assert.equal('function', typeof fixtures.connection.createConnection);
        done();
    })
    it('transaction', (done) => {
        assert.equal('function', typeof fixtures.transaction.createTransaction);
        done();
    })
    it('line_socket', (done) => {
        assert.equal('function', typeof fixtures.line_socket.connect);
        done();
    })
    it('plugin', (done) => {
        const p = new fixtures.plugin(path.join('test', 'fixtures', 'mock-plugin'));
        assert.equal('function', typeof p.load_plugin);
        done();
    })
    it('result_store', (done) => {
        const rs = new fixtures.result_store();
        // console.log(rs);
        assert.equal('function', typeof rs.add);
        done();
    })
    it('util_hmailitem', (done) => {
        assert.equal('function', typeof fixtures.util_hmailitem.newMockHMailItem);
        done();
    })
    it('vm_harness', (done) => {
        assert.equal('function', typeof fixtures.vm_harness.sandbox_require);
        done();
    })
})