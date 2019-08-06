'use strict';

const fixtures = require('../lib/stub');

exports.stub = {
    'is a function' (test) {
        test.expect(1);
        test.equal(typeof fixtures.stub, 'function');
        test.done();
    },
    'returns a function' (test) {
        test.expect(1);
        const stub = new fixtures.stub();
        test.equal(typeof stub, 'function');
        test.done();
    },
    'indicates when has been called' (test) {
        test.expect(2);
        const stub = new fixtures.stub();
        test.equal(stub.called, false);
        stub();
        test.equal(stub.called, true);
        test.done();
    },

}