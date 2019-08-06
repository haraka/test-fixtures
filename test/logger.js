'use strict';

const logger = require('../lib/logger');

const plugin = { name: 'mock_plugin' };

// console.log(logger);
exports.logger = {
    'exports logging functions' (test) {
        test.expect(4);
        test.equal(typeof logger.loginfo, 'function');
        test.equal(typeof logger.logwarn, 'function');
        test.equal(typeof logger.logerror, 'function');
        test.equal(typeof logger.log, 'function');
        test.done();
    },
    'log' (test) {
        test.expect(1);
        test.ok(logger.log('info', '_test log()_'));
        test.done();
    },
    'loginfo' (test) {
        test.expect(1);
        test.ok(logger.loginfo(plugin, '_test loginfo()_'));
        test.done();
    },
}